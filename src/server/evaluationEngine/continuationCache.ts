import { PromptInputs, RawPromptVersion, RawChainVersion } from '@/types'
import { PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { cacheExpiringValue, cacheValue, getCachedValue, getExpiringCachedValue } from '@/src/server/datastore/cache'

const getCachedContinuation = (continuationID: number, isEndpointEvaluation: boolean) =>
  isEndpointEvaluation ? getExpiringCachedValue(continuationID) : getCachedValue(continuationID)

export const loadContinuation = async (
  continuationID: number | undefined,
  inputs: PromptInputs,
  isEndpointEvaluation: boolean
): Promise<readonly [number | undefined, string | null | undefined, boolean, PromptContext, PromptInputs]> => {
  if (continuationID) {
    const cachedValue = await getCachedContinuation(continuationID, isEndpointEvaluation)
    if (cachedValue) {
      const continuation = JSON.parse(cachedValue)
      return [
        continuation.continuationIndex,
        continuation.functionCall,
        continuation.requestContinuation ?? false,
        continuation.promptContext,
        { ...continuation.inputs, ...inputs },
      ] as const
    } else {
      return [0, null, true, {}, inputs] as const
    }
  } else {
    return [undefined, null, false, {}, inputs] as const
  }
}

const cacheContinuation = (
  continuation: string,
  continuationID: number | undefined,
  version: RawPromptVersion | RawChainVersion,
  isEndpointEvaluation: boolean
) =>
  isEndpointEvaluation
    ? cacheExpiringValue(continuation, continuationID)
    : cacheValue(continuation, continuationID, { versionID: version.id, parentID: version.parentID })

export const saveContinuation = async (
  continuationID: number | undefined,
  continuationIndex: number | undefined,
  functionCall: string | null,
  requestContinuation: boolean,
  promptContext: PromptContext,
  inputs: PromptInputs,
  version: RawPromptVersion | RawChainVersion,
  isEndpointEvaluation: boolean
): Promise<number | undefined> =>
  continuationIndex !== undefined
    ? await cacheContinuation(
        JSON.stringify({ continuationIndex, inputs, promptContext, functionCall, requestContinuation }),
        continuationID,
        version,
        isEndpointEvaluation
      )
    : undefined
