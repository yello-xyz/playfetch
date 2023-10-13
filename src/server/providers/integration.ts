import { InputPriceForModel, OutputPriceForModel } from '@/src/common/providerMetadata'
import {
  AnthropicLanguageModel,
  CohereLanguageModel,
  CustomLanguageModel,
  DefaultLanguageModel,
  GoogleLanguageModel,
  LanguageModel,
  ModelProvider,
  OpenAILanguageModel,
} from '@/types'
import { encode } from 'gpt-3-encoder'
import { getProviderKey } from '../datastore/providers'
import openai, { createEmbedding, loadExtraModels } from './openai'
import anthropic from './anthropic'
import vertexai from './vertexai'
import cohere from './cohere'

const costForTokens = (content: string, pricePerMillionTokens: number) =>
  (encode(content).length * pricePerMillionTokens) / 1000000

export const CostForModel = (model: LanguageModel, input: string, output = '') =>
  costForTokens(input, InputPriceForModel(model)) + costForTokens(output, OutputPriceForModel(model))

export const APIKeyForProvider = (userID: number, provider: ModelProvider, modelToCheck?: string) => {
  switch (provider) {
    case 'google':
      return Promise.resolve(null)
    case 'openai':
    case 'anthropic':
    case 'cohere':
      return getProviderKey(userID, provider, modelToCheck)
  }
}

export const ExtraModelsForProvider = (
  provider: ModelProvider,
  apiKey: string
): Promise<{ customModels: string[]; gatedModels: DefaultLanguageModel[] }> => {
  switch (provider) {
    case 'google':
    case 'anthropic':
    case 'cohere':
      return Promise.resolve({ customModels: [], gatedModels: [] })
    case 'openai':
      return loadExtraModels(apiKey)
  }
}

export const CreateEmbedding = (provider: ModelProvider, apiKey: string, userID: number, input: string) => {
  switch (provider) {
    case 'google':
    case 'anthropic':
    case 'cohere':
      throw new Error('Provider does not support embeddings yet')
    case 'openai':
      return createEmbedding(apiKey, userID, 'text-embedding-ada-002', input)
  }
}

export const GetPredictor = (provider: ModelProvider, apiKey: string, userID: number, model: string) => {
  switch (provider) {
    case 'google':
      return vertexai(model as GoogleLanguageModel)
    case 'openai':
      return openai(apiKey, userID, model as OpenAILanguageModel | CustomLanguageModel)
    case 'anthropic':
      return anthropic(apiKey, model as AnthropicLanguageModel)
    case 'cohere':
      return cohere(apiKey, model as CohereLanguageModel)
  }
}
