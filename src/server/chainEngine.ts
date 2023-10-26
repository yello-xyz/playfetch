import {
  PromptInputs,
  RunConfig,
  CodeConfig,
  RawPromptVersion,
  RawChainVersion,
  Prompts,
  QueryConfig,
  BranchConfig,
} from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { ExtractVariables, ToCamelCase } from '@/src/common/formatting'
import { CreateCodeContextWithInputs, runCodeInContext } from '@/src/server/codeEngine'
import runPromptWithConfig from '@/src/server/promptEngine'
import { cacheExpiringValue, getExpiringCachedValue } from './datastore/cache'
import { runQuery } from './queryEngine'

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
  variable ? { ...inputs, [useCamelCase ? ToCamelCase(variable) : variable]: value } : inputs

const runWithTimer = async <T>(operation: Promise<T>) => {
  const startTime = process.hrtime.bigint()
  const result = await operation
  const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000_000
  return { ...result, duration }
}

const isRunConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is RunConfig =>
  'versionID' in config
const isQueryConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is QueryConfig =>
  'query' in config
const isBranchConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is BranchConfig =>
  'branches' in config
const isCodeConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is CodeConfig =>
  'code' in config && !isBranchConfig(config)

type PromptResponse = Awaited<ReturnType<typeof runPromptWithConfig>>
type CodeResponse = Awaited<ReturnType<typeof runCodeInContext>>
type ChainStepResponse = PromptResponse | CodeResponse
type ResponseType = Awaited<ReturnType<typeof runWithTimer<ChainStepResponse>>>

const emptyResponse: ResponseType = {
  output: '',
  result: '',
  error: undefined,
  cost: 0,
  duration: 0,
  attempts: 1,
  failed: false,
}

const MaxContinuationCount = 10

export default async function runChain(
  userID: number,
  version: RawPromptVersion | RawChainVersion,
  configs: (RunConfig | CodeConfig)[],
  inputs: PromptInputs,
  isEndpointEvaluation: boolean,
  stream?: (
    index: number,
    extraSteps: number,
    chunk: string,
    cost?: number,
    duration?: number,
    failed?: boolean
  ) => void,
  continuationID?: number
) {
  const continuationInputs = inputs
  const useCamelCase = isEndpointEvaluation
  let cost = 0
  let duration = 0
  let extraAttempts = 0
  const runChainStep = async (operation: Promise<ChainStepResponse>) => {
    const response = await runWithTimer(operation)
    cost += response.cost
    duration += response.duration
    extraAttempts += response.attempts - 1
    return response
  }

  let continuationIndex = undefined
  let requestContinuation = false
  let promptContext = {}

  if (continuationID) {
    const cachedValue = await getExpiringCachedValue(continuationID)
    if (cachedValue) {
      const continuation = JSON.parse(cachedValue)
      continuationIndex = continuation.continuationIndex
      requestContinuation = continuation.requestContinuation ?? false
      inputs = { ...continuation.inputs, ...inputs }
      promptContext = continuation.promptContext
    } else {
      continuationIndex = 0
      requestContinuation = true
    }
  }

  let lastResponse = emptyResponse
  let continuationCount = 0

  for (let index = continuationIndex ?? 0; index < configs.length; ++index) {
    const config = configs[index]
    const streamPartialResponse = (chunk: string) => stream?.(index, continuationCount, chunk)
    const streamResponse = (response: ResponseType, skipOutput = false) =>
      stream?.(
        index,
        continuationCount,
        response.failed ? response.error : skipOutput ? '' : response.output,
        response.cost,
        response.duration,
        response.failed
      )
    if (isRunConfig(config)) {
      const promptVersion = (
        config.versionID === version.id ? version : await getTrustedVersion(config.versionID, true)
      ) as RawPromptVersion
      const prompts = resolvePrompts(promptVersion.prompts, inputs, useCamelCase)
      lastResponse = await runChainStep(
        runPromptWithConfig(
          userID,
          prompts,
          promptVersion.config,
          promptContext,
          index === continuationIndex || (config.includeContext ?? false),
          streamPartialResponse,
          index === continuationIndex ? continuationInputs : undefined
        )
      )
      streamResponse(lastResponse, true)
      const functionInterrupt = lastResponse.failed ? undefined : lastResponse.functionInterrupt
      if (lastResponse.failed) {
        continuationIndex = undefined
      } else if (functionInterrupt && isEndpointEvaluation) {
        continuationIndex = index
        break
      } else if (functionInterrupt && inputs[functionInterrupt] && continuationCount < MaxContinuationCount) {
        ++continuationCount
        continuationIndex = index
        index -= 1
        continue
      } else {
        continuationIndex = index === continuationIndex && !requestContinuation ? undefined : continuationIndex
      }
    } else if (isQueryConfig(config)) {
      const query = resolvePrompt(config.query, inputs, useCamelCase)
      lastResponse = await runChainStep(
        runQuery(userID, config.provider, config.model, config.indexName, query, config.topK)
      )
      streamResponse(lastResponse)
    } else if (isCodeConfig(config) || isBranchConfig(config)) {
      // TODO implement branching
      const codeContext = CreateCodeContextWithInputs(inputs)
      lastResponse = await runChainStep(runCodeInContext(config.code, codeContext))
      streamResponse(lastResponse)
    } else {
      throw new Error('Unsupported config type in chain evaluation')
    }
    if (lastResponse.failed) {
      break
    } else {
      inputs = AugmentInputs(inputs, config.output, lastResponse.output, useCamelCase)
    }
  }

  continuationID =
    continuationIndex !== undefined
      ? await cacheExpiringValue(
          JSON.stringify({ continuationIndex, inputs, promptContext, requestContinuation }),
          continuationID
        )
      : undefined

  return { ...lastResponse, cost, duration, attempts: 1 + extraAttempts, continuationID, extraSteps: continuationCount }
}
