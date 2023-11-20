import { PromptConfig, Prompts, PromptInputs } from '@/types'
import { incrementProviderCost } from '@/src/server/datastore/providers'
import { CredentialsForProvider, GetPredictor } from '../providers/integration'
import { DefaultProvider } from '../../common/defaultConfig'
import { PublicLanguageModels, ProviderForModel } from '../../common/providerMetadata'

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
  projectID: number,
  prompts: Prompts,
  config: PromptConfig,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (chunk: string) => void,
  continuationInputs?: PromptInputs
): Promise<RunResponse> {
  const scopeIDs = [projectID, userID]
  const provider = ProviderForModel(config.model)
  const modelToCheck = (PublicLanguageModels as string[]).includes(config.model) ? undefined : config.model
  const { providerID, apiKey } = await CredentialsForProvider(scopeIDs, provider, modelToCheck)
  if (provider !== DefaultProvider && !apiKey) {
    const { apiKey: defaultModelsAPIKey } = modelToCheck ? await CredentialsForProvider(scopeIDs, provider) : { apiKey }
    return {
      error: defaultModelsAPIKey ? 'Unsupported model' : 'Missing API key',
      result: undefined,
      output: undefined,
      cost: 0,
      attempts: 1,
      failed: true,
    }
  }

  const predictor = GetPredictor(provider, apiKey ?? '', userID, config.model)

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

  if (!isErrorPredictionResponse(result) && result.cost > 0 && providerID) {
    incrementProviderCost(providerID, result.cost)
  }

  return {
    ...(isErrorPredictionResponse(result)
      ? { error: result.error, result: undefined, output: undefined, cost: 0, failed: true }
      : isValidPredictionResponse(result)
      ? { ...result, result: TryParseOutput(result.output), error: undefined, failed: false }
      : {
          ...result,
          result: undefined,
          output: undefined,
          error: 'Received empty prediction response',
          failed: true,
        }),
    attempts: Math.min(attempts, maxAttempts),
  }
}
