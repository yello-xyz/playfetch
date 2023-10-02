import { InputPriceForModel, OutputPriceForModel } from '@/src/common/providerMetadata'
import { LanguageModel, ModelProvider } from '@/types'
import { encode } from 'gpt-3-encoder'
import { getProviderKey } from '../datastore/providers'
import { loadCustomModels } from './openai'

export const CostForModel = (model: LanguageModel, input: string, output: string) =>
  (encode(input).length * InputPriceForModel(model)) / 1000000 +
  (encode(output).length * OutputPriceForModel(model)) / 1000000

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
