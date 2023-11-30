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
import { loadContinuation, saveContinuation } from './continuationCache'
import { AugmentInputs, resolvePrompt, resolvePrompts } from './resolveEngine'
import { RunResponse, EmptyRunResponse, TryParseOutput, RunWithTimer, TimedRunResponse } from './runResponse'

const isRunConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is RunConfig =>
  'versionID' in config
const isQueryConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is QueryConfig =>
  'query' in config
const isBranchConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is BranchConfig =>
  'branches' in config
const isCodeConfig = (config: RunConfig | CodeConfig | BranchConfig | QueryConfig): config is CodeConfig =>
  'code' in config && !isBranchConfig(config)

export default async function runChain(
  userID: number,
  projectID: number,
  version: RawPromptVersion | RawChainVersion,
  configs: (RunConfig | CodeConfig)[],
  inputs: PromptInputs,
  isEndpointEvaluation: boolean,
  stream?: (index: number, chunk: string, stepResponse?: TimedRunResponse) => void,
  continuationID?: number
): Promise<TimedRunResponse & { continuationID?: number }> {
  const continuationInputs = inputs
  const useCamelCase = isEndpointEvaluation
  let cost = 0
  let inputTokens = 0
  let outputTokens = 0
  let duration = 0
  let extraAttempts = 0
  const runChainStep = async (operation: Promise<RunResponse>) => {
    const response = await RunWithTimer(operation)
    cost += response.cost
    inputTokens += response.inputTokens
    outputTokens += response.outputTokens
    duration += response.duration
    extraAttempts += response.attempts - 1
    return response
  }

  const continuation = await loadContinuation(continuationID, inputs, isEndpointEvaluation)
  let continuationIndex = continuation[0]
  const requestContinuation = continuation[1]
  const promptContext = continuation[2]
  inputs = continuation[3]

  let lastResponse: TimedRunResponse = { ...EmptyRunResponse(), duration: 0 }
  let branch = 0

  for (let index = continuationIndex ?? 0; index < configs.length; ++index) {
    const config = configs[index]
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
          projectID,
          prompts,
          promptVersion.config,
          promptContext,
          index === continuationIndex || (config.includeContext ?? false),
          (chunk: string) => stream?.(index, chunk),
          index === continuationIndex ? continuationInputs : undefined
        )
      )
    } else if (isQueryConfig(config)) {
      const query = resolvePrompt(config.query, inputs, useCamelCase)
      lastResponse = await runChainStep(
        runQuery(userID, projectID, config.provider, config.model, config.indexName, query, config.topK)
      )
    } else if (isCodeConfig(config) || isBranchConfig(config)) {
      const codeContext = CreateCodeContextWithInputs(inputs)
      lastResponse = await runChainStep(runCodeInContext(config.code, codeContext))
      if (!lastResponse.failed && !lastResponse.isInterrupt && isBranchConfig(config)) {
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
    } else {
      throw new Error('Unsupported config type in chain evaluation')
    }
    stream?.(
      index,
      lastResponse.failed ? lastResponse.error : isRunConfig(config) ? '' : lastResponse.output,
      lastResponse
    )
    if (lastResponse.failed) {
      continuationIndex = undefined
      break
    } else if (lastResponse.isInterrupt) {
      continuationIndex = index
      break
    } else {
      continuationIndex = index === continuationIndex && !requestContinuation ? undefined : continuationIndex
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

  return {
    ...lastResponse,
    cost,
    inputTokens,
    outputTokens,
    duration,
    attempts: 1 + extraAttempts,
    continuationID,
  }
}

export const ChainResponseFromValue = (value: any): Awaited<ReturnType<typeof runChain>> | null =>
  value
    ? {
        ...EmptyRunResponse(),
        result: TryParseOutput(value),
        output: value,
        duration: 0,
        continuationID: undefined,
      }
    : null
