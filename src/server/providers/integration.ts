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
import { getProviderCredentials } from '../datastore/providers'
import openai, { createEmbedding, loadExtraModels } from './openai'
import anthropic from './anthropic'
import vertexai from './vertexai'
import cohere from './cohere'
import { updateScopedModelCost } from '../datastore/costs'
import { checkBudgetForScope, incrementCostForScope } from '../datastore/budgets'

const costForTokens = (content: string, pricePerMillionTokens: number) => {
  const tokens = encode(content).length
  const cost = (tokens * pricePerMillionTokens) / 1000000
  return [cost, tokens]
}

export const CostForModel = (model: LanguageModel, input: string, output = '') => {
  const [inputCost, inputTokens] = costForTokens(input, InputPriceForModel(model))
  const [outputCost, outputTokens] = costForTokens(output, OutputPriceForModel(model))
  return [inputCost + outputCost, inputTokens, outputTokens]
}

export const CredentialsForProvider = async (scopeIDs: number[], provider: ModelProvider, modelToCheck?: string) => {
  switch (provider) {
    case 'google':
      return Promise.resolve({ scopeID: null, providerID: null, apiKey: null })
    case 'openai':
    case 'anthropic':
    case 'cohere':
      const { scopeID, providerID, apiKey } = await getProviderCredentials(scopeIDs, provider, modelToCheck)
      return { scopeID, providerID, apiKey }
  }
}

export const CheckBudgetForProvider = async (scopeID: number | null, provider: ModelProvider) => {
  switch (provider) {
    case 'google':
      return Promise.resolve(true)
    case 'openai':
    case 'anthropic':
    case 'cohere':
      return !!scopeID && checkBudgetForScope(scopeID)
  }
}

export const IncrementProviderCost = (
  scopeID: number | null,
  providerID: number | null,
  model: string,
  cost: number
) => {
  if (scopeID && providerID && cost > 0) {
    updateScopedModelCost(scopeID, model, cost)
    incrementCostForScope(scopeID, cost)
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
