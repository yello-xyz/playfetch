import {
  PromptInputs,
  RunConfig,
  CodeConfig,
  RawPromptVersion,
  RawChainVersion,
  QueryConfig,
  BranchConfig,
} from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { CreateCodeContextWithInputs, runCodeInContext } from '@/src/server/evaluationEngine/codeEngine'
import runPromptWithConfig from '@/src/server/evaluationEngine/promptEngine'
import { runQuery } from './queryEngine'
import { FirstBranchForBranchOfNode } from '../../common/branching'
import { MaxContinuationCount, loadContinuation, saveContinuation } from './continuation'
import { AugmentInputs, resolvePrompt, resolvePrompts } from './resolveEngine'

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

  const continuation = await loadContinuation(continuationID, inputs, isEndpointEvaluation)
  let continuationIndex = continuation[0]
  const requestContinuation = continuation[1]
  const promptContext = continuation[2]
  inputs = continuation[3]

  let lastResponse = emptyResponse
  let continuationCount = 0
  let branch = 0

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
    if (config.branch !== branch) {
      continue
    }
    if (isRunConfig(config)) {
      const promptVersion = (
        config.versionID === version.id ? version : await getTrustedVersion(config.versionID, true)
      ) as RawPromptVersion
      const isContinuedChat = index === continuationIndex && promptVersion.config.isChat
      const prompts = resolvePrompts(promptVersion.prompts, inputs, useCamelCase, isContinuedChat)
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
      } else if (promptVersion.config.isChat || (functionInterrupt && isEndpointEvaluation)) {
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
      const codeContext = CreateCodeContextWithInputs(inputs)
      lastResponse = await runChainStep(runCodeInContext(config.code, codeContext))
      if (!lastResponse.failed && isBranchConfig(config)) {
        const branchIndex = config.branches.indexOf(lastResponse.output)
        if (branchIndex >= 0) {
          branch = FirstBranchForBranchOfNode(
            configs.map(item => ({ ...item, code: '' })),
            index,
            branchIndex
          )
        } else {
          lastResponse = {
            ...lastResponse,
            output: undefined,
            result: undefined,
            error: `Invalid branch "${lastResponse.output}"`,
            failed: true,
          }
        }
      }
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

  continuationID = await saveContinuation(
    continuationID,
    continuationIndex,
    requestContinuation,
    promptContext,
    inputs,
    version,
    isEndpointEvaluation
  )

  return { ...lastResponse, cost, duration, attempts: 1 + extraAttempts, continuationID, extraSteps: continuationCount }
}
