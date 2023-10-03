import {
  PromptConfig,
  ModelProvider,
  OpenAILanguageModel,
  GoogleLanguageModel,
  AnthropicLanguageModel,
  CohereLanguageModel,
  Prompts,
  PromptInputs,
  CustomLanguageModel,
} from '@/types'
import openai from '@/src/server/providers/openai'
import anthropic from '@/src/server/providers/anthropic'
import vertexai from '@/src/server/providers/vertexai'
import cohere from '@/src/server/providers/cohere'
import { incrementProviderCostForUser } from '@/src/server/datastore/providers'
import { APIKeyForProvider } from './providers/integration'
import { DefaultProvider } from '../common/defaultConfig'
import { AllModels } from '../common/providerMetadata'

type ValidOrEmptyPredictionResponse = { output: string; cost: number }
type ErrorPredictionResponse = { error: string }
type PredictionResponse = (ValidOrEmptyPredictionResponse | ErrorPredictionResponse) & {
  functionInterrupt?: string
}

export type PromptContext = any
export type Predictor = (
  prompts: Prompts,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (text: string) => void,
  continuationInputs?: PromptInputs
) => Promise<PredictionResponse>

const isErrorPredictionResponse = (response: PredictionResponse): response is ErrorPredictionResponse =>
  'error' in response
const isValidOrEmptyPredictionResponse = (response: PredictionResponse): response is ValidOrEmptyPredictionResponse =>
  'output' in response
const isValidPredictionResponse = (response: PredictionResponse) =>
  isValidOrEmptyPredictionResponse(response) && response.output.length > 0

type RunResponse = (
  | { result: any; output: string; error: undefined; failed: false; functionInterrupt?: string }
  | { result: undefined; output: undefined; error: string; failed: true }
) & { cost: number; attempts: number }

export const TryParseOutput = (output: string | undefined) => {
  try {
    return output ? JSON.parse(output) : output
  } catch {
    return output
  }
}

export default async function runPromptWithConfig(
  userID: number,
  prompts: Prompts,
  config: PromptConfig,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (chunk: string) => void,
  continuationInputs?: PromptInputs
): Promise<RunResponse> {
  const customModel = AllModels.includes(config.model) ? undefined : config.model
  const apiKey = await APIKeyForProvider(userID, config.provider, customModel)
  if (config.provider !== DefaultProvider && !apiKey) {
    const defaultModelsAPIKey = customModel ? await APIKeyForProvider(userID, config.provider) : apiKey
    return {
      error: defaultModelsAPIKey ? 'Unsupported model' : 'Missing API key',
      result: undefined,
      output: undefined,
      cost: 0,
      attempts: 1,
      failed: true,
    }
  }

  const getPredictor = (provider: ModelProvider, apiKey: string): Predictor => {
    switch (provider) {
      case 'google':
        return vertexai(config.model as GoogleLanguageModel)
      case 'openai':
        return openai(apiKey, userID, config.model as OpenAILanguageModel | CustomLanguageModel)
      case 'anthropic':
        return anthropic(apiKey, config.model as AnthropicLanguageModel)
      case 'cohere':
        return cohere(apiKey, config.model as CohereLanguageModel)
    }
  }
  const predictor: Predictor = getPredictor(config.provider, apiKey ?? '')

  let result: PredictionResponse = { output: '', cost: 0 }
  let attempts = 0
  const maxAttempts = 3
  while (++attempts <= maxAttempts) {
    result = await predictor(
      prompts,
      config.temperature,
      config.maxTokens,
      context,
      usePreviousContext,
      streamChunks,
      continuationInputs
    )
    if (isValidPredictionResponse(result)) {
      break
    }
  }

  if (!isErrorPredictionResponse(result) && result.cost > 0) {
    incrementProviderCostForUser(userID, config.provider, result.cost)
  }

  return {
    ...(isErrorPredictionResponse(result)
      ? { error: result.error, result: undefined, output: undefined, cost: 0, failed: true }
      : isValidPredictionResponse(result)
      ? { ...result, result: TryParseOutput(result.output), error: undefined, failed: false }
      : { ...result, result: undefined, output: undefined, error: 'Received empty prediction response', failed: true }),
    attempts: Math.min(attempts, maxAttempts),
  }
}
