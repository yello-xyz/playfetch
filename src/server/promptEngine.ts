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

type PredictionResponse = { output: string | undefined; cost: number }
type RunResponse = PredictionResponse & { failed: boolean; attempts: number; cacheHit: boolean }

const runPromptWithConfig = async (
  userID: number,
  prompt: string,
  config: PromptConfig,
  useCache: boolean,
  streamChunks?: (chunk: string) => void
): Promise<RunResponse> => {
  const cacheKey = {
    provider: config.provider,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    prompt,
  }

  const cachedValue = useCache ? await getCachedValue(cacheKey) : undefined
  if (cachedValue) {
    return { output: cachedValue, cost: 0, failed: false, attempts: 1, cacheHit: true }
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
  const hasFailed = (result: PredictionResponse) => !result.output?.length
  while (++attempts <= maxAttempts) {
    result = await predictor(prompt, config.temperature, config.maxTokens, streamChunks)
    if (hasFailed(result)) {
      break
    }
  }

  if (useCache && result.output?.length) {
    await cacheValue(cacheKey, result.output)
  }

  if (result.cost > 0) {
    await incrementProviderCostForUser(userID, config.provider, result.cost)
  }

  return { ...result, failed: hasFailed(result), attempts, cacheHit: false }
}

export default runPromptWithConfig
