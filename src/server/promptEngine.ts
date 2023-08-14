import {
  PromptConfig,
  ModelProvider,
  OpenAILanguageModel,
  GoogleLanguageModel,
  AnthropicLanguageModel,
  CohereLanguageModel,
} from '@/types'
import openai from '@/src/server/openai'
import anthropic from '@/src/server/anthropic'
import vertexai from '@/src/server/vertexai'
import cohere from '@/src/server/cohere'
import { cacheValue, getCachedValue } from '@/src/server/datastore/cache'
import { getProviderKey, incrementProviderCostForUser } from '@/src/server/datastore/providers'

type ValidPredictionResponse = { output: string; cost: number }
type ErrorPredictionResponse = { error: string }
type PredictionResponse = { output: string | undefined; cost: number } | ErrorPredictionResponse

const isValidPredictionResponse = (response: PredictionResponse): response is ValidPredictionResponse =>
  'output' in response && !!response.output && response.output.length > 0
const isErrorPredictionResponse = (response: PredictionResponse): response is ErrorPredictionResponse =>
  'error' in response

type RunResponse = (
  | { result: any; output: string; error: undefined; failed: false }
  | { result: undefined; output: undefined; error: string; failed: true }
) & { cost: number; attempts: number; cacheHit: boolean }

export default async function runPromptWithConfig(
  userID: number,
  prompt: string,
  config: PromptConfig,
  useCache: boolean,
  streamChunks?: (chunk: string) => void
): Promise<RunResponse> {
  const parseOutput = (output: string | undefined) => {
    try {
      return output ? JSON.parse(output) : output
    } catch {
      return output
    }
  }

  const cacheKey = {
    provider: config.provider,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    prompt,
  }

  const cachedValue = useCache ? await getCachedValue(cacheKey) : undefined
  if (cachedValue) {
    return {
      result: parseOutput(cachedValue),
      output: cachedValue,
      error: undefined,
      cost: 0,
      failed: false,
      attempts: 1,
      cacheHit: true,
    }
  }

  const getAPIKey = async (provider: ModelProvider) => {
    switch (provider) {
      case 'google':
        return null
      case 'openai':
      case 'anthropic':
      case 'cohere':
        return getProviderKey(userID, provider)
    }
  }

  const getPredictor = (provider: ModelProvider, apiKey: string) => {
    switch (provider) {
      case 'google':
        return vertexai(config.model as GoogleLanguageModel)
      case 'openai':
        return openai(apiKey, userID, config.model as OpenAILanguageModel)
      case 'anthropic':
        return anthropic(apiKey, config.model as AnthropicLanguageModel)
      case 'cohere':
        return cohere(apiKey, config.model as CohereLanguageModel)
    }
  }

  const apiKey = await getAPIKey(config.provider)
  const predictor = getPredictor(config.provider, apiKey ?? '')

  let result: PredictionResponse = { output: undefined, cost: 0 }
  let attempts = 0
  const maxAttempts = 3
  while (++attempts <= maxAttempts) {
    result = await predictor(prompt, config.temperature, config.maxTokens, streamChunks)
    if (isValidPredictionResponse(result)) {
      break
    }
  }

  if (useCache && isValidPredictionResponse(result)) {
    await cacheValue(cacheKey, result.output)
  }

  if (!isErrorPredictionResponse(result)) {
    await incrementProviderCostForUser(userID, config.provider, result.cost)
  }

  return {
    ...(isErrorPredictionResponse(result)
      ? { error: result.error, result: undefined, output: undefined, cost: 0, failed: true }
      : isValidPredictionResponse(result)
      ? { ...result, result: parseOutput(result.output), error: undefined, failed: false }
      : { ...result, result: undefined, output: undefined, error: 'Received empty prediction response', failed: true }),
    attempts,
    cacheHit: false,
  }
}
