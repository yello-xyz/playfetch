import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, Version, CodeConfig } from '@/types'
import { getVersion } from '@/src/server/datastore/versions'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import {
  AugmentCodeContext,
  CreateCodeContextWithInputs,
  EvaluateCode,
  IsCodeResponseError,
} from '@/src/server/codeEngine'
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

type CallbackType = (
  index: number,
  version: Version | null,
  response: { output?: string; cost: number; attempts: number; cacheHit: boolean; failed: boolean }
) => Promise<any>

export const runChainConfigs = async (
  userID: number,
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
      const version = await getVersion(config.versionID)
      let prompt = resolvePrompt(version.prompt, inputs, useCamelCase)
      runningContext += prompt
      if (config.includeContext) {
        prompt = runningContext
      }
      const runResponse = await runPromptWithConfig(userID, prompt, version.config, useCache, stream)
      const output = runResponse.output
      try {
        result = output ? JSON.parse(output) : output
      } catch {
        result = output
      }
      if (!output?.length) {
        await callback(index, null, { ...runResponse, failed: true })
        break
      }
      runningContext += `\n\n${output}\n\n`
      AugmentInputs(inputs, config.output, output, useCamelCase)
      AugmentCodeContext(codeContext, config.output, result)
      await callback(index, version, { ...runResponse, failed: false })
    } else {
      const codeResponse = await EvaluateCode(config.code, codeContext)
      result = codeResponse.result
      if (IsCodeResponseError(codeResponse)) {
        stream(codeResponse.error.message)
        await callback(index, null, { cost: 0, attempts: 1, cacheHit: false, failed: true })
        break
      }
      const output = codeResponse.output
      stream(output)
      AugmentInputs(inputs, config.output, output, useCamelCase)
      AugmentCodeContext(codeContext, config.output, result)
      await callback(index, null, { output, cost: 0, attempts: 1, cacheHit: false, failed: false })
    }
  }

  return result
}

async function runChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const configs: (RunConfig | CodeConfig)[] = req.body.configs
  const multipleInputs: PromptInputs[] = req.body.inputs

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  for (const inputs of multipleInputs) {
    await runChainConfigs(
      user.id,
      configs,
      inputs,
      false,
      false,
      (index, version, { output, cost, failed }) => {
        const createdAt = new Date()
        sendData({ index, timestamp: createdAt.toISOString(), cost, failed })
        return version && output && !failed
          ? saveRun(user.id, version.promptID, version.id, inputs, output, createdAt, cost)
          : Promise.resolve({})
      },
      (index, message) => sendData({ index, message })
    )
  }

  res.end()
}

export default withLoggedInUserRoute(runChain)
