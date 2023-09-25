import {
  PromptConfig,
  ModelProvider,
  OpenAILanguageModel,
  GoogleLanguageModel,
  AnthropicLanguageModel,
  CohereLanguageModel,
  Prompts,
  PromptInputs,
} from '@/types'
import openai from '@/src/server/providers/openai'
import anthropic from '@/src/server/providers/anthropic'
import vertexai from '@/src/server/providers/vertexai'
import cohere from '@/src/server/providers/cohere'
import { getProviderKey, incrementProviderCostForUser } from '@/src/server/datastore/providers'

type ValidPredictionResponse = { output: string; cost: number }
type ErrorPredictionResponse = { error: string }
type PredictionResponse = ({ output: undefined; cost: number } | ValidPredictionResponse | ErrorPredictionResponse) & {
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

const isValidPredictionResponse = (response: PredictionResponse): response is ValidPredictionResponse =>
  'output' in response && !!response.output && response.output.length > 0
const isErrorPredictionResponse = (response: PredictionResponse): response is ErrorPredictionResponse =>
  'error' in response

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

  const getPredictor = (provider: ModelProvider, apiKey: string): Predictor => {
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
  const predictor: Predictor = getPredictor(config.provider, apiKey ?? '')

  let result: PredictionResponse = { output: undefined, cost: 0 }
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
    await incrementProviderCostForUser(userID, config.provider, result.cost)
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
