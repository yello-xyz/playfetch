import { PromptInputs, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import { AugmentCodeContext, CreateCodeContextWithInputs, runCodeInContext } from '@/src/server/codeEngine'
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

const isRunConfig = (config: RunConfig | CodeConfig): config is RunConfig => 'versionID' in config

type ChainStepResponse = Awaited<ReturnType<typeof runPromptWithConfig>>
type ResponseType = Awaited<ReturnType<typeof runWithTimer<ChainStepResponse>>>

const emptyResponse: ResponseType = {
  output: '',
  result: '',
  error: undefined,
  cost: 0,
  duration: 0,
  attempts: 1,
  cacheHit: false,
  failed: false,
}

type CallbackType = (index: number, version: RawPromptVersion | null, response: ResponseType) => Promise<any>

export default async function runChain(
  userID: number,
  version: RawPromptVersion | RawChainVersion,
  configs: (RunConfig | CodeConfig)[],
  inputs: PromptInputs,
  useCache: boolean,
  useCamelCase: boolean,
  streamChunk?: (index: number, chunk: string) => void,
  callback?: CallbackType,
) {
  let cost = 0
  let duration = 0
  let extraAttempts = 0
  let cacheHit = false
  const runChainStep = async (operation: Promise<ChainStepResponse>) => {
    const response = await runWithTimer(operation)
    cost += response.cost
    duration += response.duration
    extraAttempts += response.attempts - 1
    cacheHit = cacheHit || response.cacheHit
    return response
  }

  let lastResponse = emptyResponse
  let runningContext = ''
  const codeContext = CreateCodeContextWithInputs(inputs)

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
      lastResponse = await runChainStep(runPromptWithConfig(userID, prompt, promptVersion.config, useCache, stream))
      const output = lastResponse.output
      if (lastResponse.failed) {
        stream(lastResponse.error)
      }
      await callback?.(index, promptVersion, lastResponse)
      if (lastResponse.failed) {
        break
      } else {
        runningContext += `\n\n${output}\n\n`
        AugmentInputs(inputs, config.output, output!, useCamelCase)
        AugmentCodeContext(codeContext, config.output, lastResponse.result)
      }
    } else {
      lastResponse = await runChainStep(runCodeInContext(config.code, codeContext))
      stream(lastResponse.failed ? lastResponse.error : lastResponse.output)
      await callback?.(index, null, lastResponse)
      if (lastResponse.failed) {
        break
      } else {
        AugmentInputs(inputs, config.output, lastResponse.output, useCamelCase)
        AugmentCodeContext(codeContext, config.output, lastResponse.result)
      }
    }
  }

  return { ...lastResponse, cost, duration, cacheHit, attempts: 1 + extraAttempts }
}
