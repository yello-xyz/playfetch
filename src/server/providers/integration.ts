import { InputPriceForModel, OutputPriceForModel } from '@/src/common/providerMetadata'
import { LanguageModel, ModelProvider } from '@/types'
import { encode } from 'gpt-3-encoder'
import { getProviderKey, incrementProviderCostForUser } from '../datastore/providers'
import { createEmbedding, loadCustomModels } from './openai'

const costForTokens = (content: string, pricePerMillionTokens: number) =>
  (encode(content).length * pricePerMillionTokens) / 1000000

export const CostForModel = (model: LanguageModel, input: string, output: string) =>
  costForTokens(input, InputPriceForModel(model)) + costForTokens(output, OutputPriceForModel(model))

export const APIKeyForProvider = async (userID: number, provider: ModelProvider, customModel?: string) => {
  switch (provider) {
    case 'google':
      return null
    case 'openai':
    case 'anthropic':
    case 'cohere':
      return getProviderKey(userID, provider, customModel)
  }
}

export const CustomModelsForProvider = async (provider: ModelProvider, apiKey: string): Promise<string[]> => {
  switch (provider) {
    case 'google':
    case 'anthropic':
    case 'cohere':
      return []
    case 'openai':
      return loadCustomModels(apiKey)
  }
}

export const CreateEmbedding = async (userID: number, input: string | string[]) => {
  const apiKey = await APIKeyForProvider(userID, 'openai')
  if (!apiKey) {
    throw new Error('Missing API key')
  }

  const embedding = createEmbedding(apiKey, userID, 'text-embedding-ada-002', input)

  const pricePerMillionTokens = 0.1
  const flattenedInput = Array.isArray(input) ? input.join('\n') : input
  const cost = costForTokens(flattenedInput, pricePerMillionTokens)
  incrementProviderCostForUser(userID, 'openai', cost)
  
  return embedding
}
