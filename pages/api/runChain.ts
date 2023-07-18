import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, Version, CodeConfig } from '@/types'
import { getVersion } from '@/src/server/datastore/versions'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import runCode from '@/src/server/codeEngine'
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

const postProcess = (inputs: PromptInputs, output: string, config: RunConfig | CodeConfig, useCamelCase: boolean) => {
  if (config.output) {
    const variable = useCamelCase ? ToCamelCase(config.output) : config.output
    inputs[variable] = output
  }
  return output
}

type CallbackType = (
  version: Version | null,
  response: { output: string; cost: number; attempts: number; cacheHit: boolean }
) => Promise<any>

export const runChainConfigs = async (
  userID: number,
  configs: (RunConfig | CodeConfig)[],
  inputs: PromptInputs,
  useCache: boolean,
  useCamelCase: boolean,
  callback: CallbackType,
  streamChunks?: (chunk: string) => void
) => {
  let lastOutput = undefined as string | undefined
  let runningContext = ''

  const isRunConfig = (config: RunConfig | CodeConfig): config is RunConfig => 'versionID' in config

  for (const config of configs) {
    if (isRunConfig(config)) {
      const version = await getVersion(config.versionID)
      let prompt = resolvePrompt(version.prompt, inputs, useCamelCase)
      runningContext += prompt
      if (config.includeContext) {
        prompt = runningContext
      }
      const runResponse = await runPromptWithConfig(userID, prompt, version.config, useCache, streamChunks)
      const output = runResponse.output
      if (!output?.length) {
        break
      }
      lastOutput = postProcess(inputs, output, config, useCamelCase)
      runningContext += `\n\n${output}\n\n`
      await callback(version, { ...runResponse, output })
    } else {
      const output = await runCode(config.code, inputs, streamChunks)
      if (!output?.length) {
        break
      }
      streamChunks?.(output)
      lastOutput = postProcess(inputs, output, config, useCamelCase)
      await callback(null, { output, cost: 0, attempts: 1, cacheHit: false })
    }
  }

  return lastOutput
}

async function runChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const configs: (RunConfig | CodeConfig)[] = req.body.configs
  const multipleInputs: PromptInputs[] = req.body.inputs

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  let index = 0
  for (const inputs of multipleInputs) {
    await runChainConfigs(
      user.id,
      configs,
      inputs,
      false,
      false,
      (version, { output, cost }) => {
        const createdAt = new Date()
        sendData({ index: index++, timestamp: createdAt.toISOString(), cost })
        return version
          ? saveRun(user.id, version.promptID, version.id, inputs, output, createdAt, cost)
          : Promise.resolve({})
      },
      message => sendData({ index, message })
    )
  }

  res.end()
}

export default withLoggedInUserRoute(runChain)
