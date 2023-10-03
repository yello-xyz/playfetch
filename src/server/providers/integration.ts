import { InputPriceForModel, OutputPriceForModel } from '@/src/common/providerMetadata'
import { LanguageModel, ModelProvider } from '@/types'
import { encode } from 'gpt-3-encoder'
import { getProviderKey } from '../datastore/providers'
import { createEmbedding, loadCustomModels } from './openai'

const costForTokens = (content: string, pricePerMillionTokens: number) =>
  (encode(content).length * pricePerMillionTokens) / 1000000

export const CostForModel = (model: LanguageModel, input: string, output = '') =>
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

export const CreateEmbedding = async (provider: ModelProvider, apiKey: string, userID: number, input: string) => {
  switch (provider) {
    case 'google':
    case 'anthropic':
    case 'cohere':
      throw new Error('Provider does not support embeddings yet')
    case 'openai':
      return createEmbedding(apiKey, userID, 'text-embedding-ada-002', input)
  }
}
