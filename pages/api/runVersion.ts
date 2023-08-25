import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import { AugmentCodeContext, CreateCodeContextWithInputs, EvaluateCode } from '@/src/server/codeEngine'
import runPromptWithConfig from '@/src/server/promptEngine'

const promptToCamelCase = (prompt: string) =>
  ExtractPromptVariables(prompt).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
    prompt
  )

const resolvePrompt = (prompt: string, inputs: PromptInputs, useCamelCase: boolean) =>
  Object.entries(inputs).reduce(
    (prompt, [variable, value]) => prompt.replaceAll(`{{${variable}}}`, value),
    useCamelCase ? promptToCamelCase(prompt) : prompt
  )

const AugmentInputs = (inputs: PromptInputs, variable: string | undefined, value: string, useCamelCase: boolean) =>
  variable ? (inputs[useCamelCase ? ToCamelCase(variable) : variable] = value) : undefined

const runWithTimer = async <T>(operation: Promise<T>) => {
  const startTime = process.hrtime.bigint()
  const result = await operation
  const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000_000
  return { ...result, duration }
}

type CallbackType = (
  index: number,
  version: RawPromptVersion | null,
  response: {
    result?: any
    output?: string
    error?: string
    cost: number
    duration: number
    attempts: number
    cacheHit: boolean
    failed: boolean
  }
) => Promise<any>

export const runChainConfigs = async (
  userID: number,
  version: RawPromptVersion | RawChainVersion,
  configs: (RunConfig | CodeConfig)[],
  inputs: PromptInputs,
  useCache: boolean,
  useCamelCase: boolean,
  callback: CallbackType,
  streamChunk?: (index: number, chunk: string) => void
) => {
  let result = undefined
  let runningContext = ''
  const codeContext = CreateCodeContextWithInputs(inputs)

  const isRunConfig = (config: RunConfig | CodeConfig): config is RunConfig => 'versionID' in config

  for (const [index, config] of configs.entries()) {
    const stream = (chunk: string) => streamChunk?.(index, chunk)
    if (isRunConfig(config)) {
      const promptVersion = (
        config.versionID === version.id ? version : await getTrustedVersion(config.versionID)
      ) as RawPromptVersion
      let prompt = resolvePrompt(promptVersion.prompt, inputs, useCamelCase)
      runningContext += prompt
      if (config.includeContext) {
        prompt = runningContext
      }
      const runResponse = await runWithTimer(
        runPromptWithConfig(userID, prompt, promptVersion.config, useCache, stream)
      )
      const output = runResponse.output
      result = runResponse.result
      if (runResponse.failed) {
        stream(runResponse.error)
      }
      await callback(index, promptVersion, runResponse)
      if (runResponse.failed) {
        break
      } else {
        runningContext += `\n\n${output}\n\n`
        AugmentInputs(inputs, config.output, output!, useCamelCase)
        AugmentCodeContext(codeContext, config.output, result)
      }
    } else {
      const codeResponse = await runWithTimer(EvaluateCode(config.code, codeContext))
      result = codeResponse.result
      stream(codeResponse.failed ? codeResponse.error : codeResponse.output)
      await callback(index, null, codeResponse)
      if (codeResponse.failed) {
        break
      } else {
        AugmentInputs(inputs, config.output, codeResponse.output, useCamelCase)
        AugmentCodeContext(codeContext, config.output, result)
      }
    }
  }

  return result
}

export const loadConfigsFromVersion = (version: RawPromptVersion | RawChainVersion): (RunConfig | CodeConfig)[] =>
  version.items ?? [{ versionID: version.id }]

async function runVersion(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const multipleInputs: PromptInputs[] = req.body.inputs

  const version = await getTrustedVersion(versionID)
  const configs = loadConfigsFromVersion(version)

  let totalCost = 0
  let totalDuration = 0
  const updateChainVersion = version.items
    ? (index: number, inputs: PromptInputs, output: string, cost: number, duration: number) => {
        totalCost += cost
        totalDuration += duration
        if (index === configs.length - 1) {
          saveRun(user.id, version.parentID, version.id, inputs, output, new Date(), totalCost, totalDuration, [])
        }
      }
    : undefined

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  await Promise.all(
    multipleInputs.map((inputs, inputIndex) => {
      const offset = (index: number) => inputIndex * configs.length + index
      return runChainConfigs(
        user.id,
        version,
        configs,
        inputs,
        false,
        false,
        // TODO the appropriate inputs for the specific run should be passed in here as well.
        // TODO no need to persist individual prompt runs when evaluating a chain version?
        (index, version, { output, cost, duration, failed }) => {
          const createdAt = new Date()
          sendData({ index: offset(index), timestamp: createdAt.toISOString(), cost, duration, failed })
          if (updateChainVersion && output && !failed) {
            updateChainVersion(index, inputs, output, cost, duration)
          }
          return version && output && !failed
            ? saveRun(user.id, version.parentID, version.id, inputs, output, createdAt, cost, duration, [])
            : Promise.resolve({})
        },
        (index, message) => sendData({ index: offset(index), message })
      )
    })
  )

  res.end()
}

export default withLoggedInUserRoute(runVersion)
