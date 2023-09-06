import { PromptInputs, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion, Prompts } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { ExtractVariables, ToCamelCase } from '@/src/common/formatting'
import { AugmentCodeContext, CreateCodeContextWithInputs, runCodeInContext } from '@/src/server/codeEngine'
import runPromptWithConfig from '@/src/server/promptEngine'
import { cacheExpiringValue } from './datastore/cache'

const promptToCamelCase = (prompt: string) =>
  ExtractVariables(prompt).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
    prompt
  )

const resolvePrompt = (prompt: string, inputs: PromptInputs, useCamelCase: boolean) =>
  Object.entries(inputs).reduce(
    (prompt, [variable, value]) => prompt.replaceAll(`{{${variable}}}`, value),
    useCamelCase ? promptToCamelCase(prompt) : prompt
  )

const resolvePrompts = (prompts: Prompts, inputs: PromptInputs, useCamelCase: boolean) =>
  Object.fromEntries(
    Object.entries(prompts).map(([key, value]) => [key, resolvePrompt(value, inputs, useCamelCase)])
  ) as Prompts

const AugmentInputs = (inputs: PromptInputs, variable: string | undefined, value: string, useCamelCase: boolean) =>
  variable ? (inputs[useCamelCase ? ToCamelCase(variable) : variable] = value) : undefined

const runWithTimer = async <T>(operation: Promise<T>) => {
  const startTime = process.hrtime.bigint()
  const result = await operation
  const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000_000
  return { ...result, duration }
}

const isRunConfig = (config: RunConfig | CodeConfig): config is RunConfig => 'versionID' in config

type PromptResponse = Awaited<ReturnType<typeof runPromptWithConfig>>
type CodeResponse = Awaited<ReturnType<typeof runCodeInContext>>
type ChainStepResponse = PromptResponse | CodeResponse
const isPromptResponse = (response: ChainStepResponse): response is PromptResponse => 'interrupted' in response
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

export default async function runChain(
  userID: number,
  version: RawPromptVersion | RawChainVersion,
  configs: (RunConfig | CodeConfig)[],
  inputs: PromptInputs,
  isEndpointEvaluation: boolean,
  stream?: (index: number, chunk: string, cost?: number, duration?: number, failed?: boolean) => void
) {
  const useCamelCase = isEndpointEvaluation
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

  let continuationIndex = undefined
  const promptContext = {}
  const codeContext = CreateCodeContextWithInputs(inputs)
  let lastResponse = emptyResponse

  for (const [index, config] of configs.entries()) {
    const streamPartialResponse = (chunk: string) => stream?.(index, chunk)
    const streamResponse = (response: ResponseType, skipOutput = false) =>
      stream?.(
        index,
        response.failed ? response.error : skipOutput ? '' : response.output,
        response.cost,
        response.duration,
        response.failed
      )
    if (isRunConfig(config)) {
      const promptVersion = (
        config.versionID === version.id ? version : await getTrustedVersion(config.versionID, true)
      ) as RawPromptVersion
      let prompts = resolvePrompts(promptVersion.prompts, inputs, useCamelCase)
      const useContext = config.includeContext ?? false
      lastResponse = await runChainStep(
        runPromptWithConfig(userID, prompts, promptVersion.config, promptContext, useContext, streamPartialResponse)
      )
      streamResponse(lastResponse, true)
      if (lastResponse.failed) {
        break
      } else if (isPromptResponse(lastResponse) && lastResponse.interrupted) {
        continuationIndex = index
        break
      } else {
        const output = lastResponse.output
        AugmentInputs(inputs, config.output, output!, useCamelCase)
        AugmentCodeContext(codeContext, config.output, lastResponse.result)
      }
    } else {
      lastResponse = await runChainStep(runCodeInContext(config.code, codeContext))
      streamResponse(lastResponse)
      if (lastResponse.failed) {
        break
      } else {
        AugmentInputs(inputs, config.output, lastResponse.output, useCamelCase)
        AugmentCodeContext(codeContext, config.output, lastResponse.result)
      }
    }
  }

  const continuationID =
    continuationIndex !== undefined
      ? await cacheExpiringValue(JSON.stringify({ continuationIndex, inputs, promptContext }))
      : undefined

  return { ...lastResponse, cost, duration, cacheHit, attempts: 1 + extraAttempts, continuationID }
}
