import { PromptConfig, ModelProvider, OpenAILanguageModel, GoogleLanguageModel, AnthropicLanguageModel } from '@/types'
import openai from '@/src/server/openai'
import anthropic from '@/src/server/anthropic'
import vertexai from '@/src/server/vertexai'
import { cacheValue, getCachedValue } from '@/src/server/datastore/cache'
import { getProviderKey, incrementProviderCostForUser } from '@/src/server/datastore/providers'

type PredictionResponse = { output: string | undefined; cost: number }
type RunResponse = PredictionResponse & { attempts: number; cacheHit: boolean }

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
    return { output: cachedValue, cost: 0, attempts: 1, cacheHit: true }
  }

  const getAPIKey = async (provider: ModelProvider) => {
    switch (provider) {
      default:
      case 'google':
        return null
      case 'openai':
      case 'anthropic':
        return getProviderKey(userID, provider)
    }
  }

  const getPredictor = (provider: ModelProvider, apiKey: string) => {
    switch (provider) {
      default:
      case 'google':
        return vertexai(config.model as GoogleLanguageModel)
      case 'openai':
        return openai(apiKey, userID, config.model as OpenAILanguageModel)
      case 'anthropic':
        return anthropic(apiKey, config.model as AnthropicLanguageModel)
    }
  }

  const apiKey = await getAPIKey(config.provider)
  const predictor = getPredictor(config.provider, apiKey ?? '')

  let result: PredictionResponse = { output: undefined, cost: 0 }
  let attempts = 0
  const maxAttempts = 3
  while (++attempts <= maxAttempts) {
    result = await predictor(prompt, config.temperature, config.maxTokens, streamChunks)
    if (result.output?.length) {
      break
    }
  }

  if (useCache && result.output?.length) {
    await cacheValue(cacheKey, result.output)
  }

  if (result.cost > 0) {
    await incrementProviderCostForUser(userID, config.provider, result.cost)
  }

  return { ...result, attempts, cacheHit: false }
}

export default runPromptWithConfig
