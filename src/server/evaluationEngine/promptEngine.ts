import { PromptConfig, Prompts, PromptInputs } from '@/types'
import {
  CheckBudgetForProvider,
  CredentialsForProvider,
  GetPredictor,
  IncrementProviderCost,
} from '../providers/integration'
import { DefaultProvider } from '../../common/defaultConfig'
import { PublicLanguageModels, ProviderForModel } from '../../common/providerMetadata'
import { EmptyRunResponse, ErrorRunResponse, RunResponse, TryParseOutput } from './chainEngine'

type ValidOrEmptyPredictionResponse = { output: string; cost: number; isFunctionCall: boolean }
type ErrorPredictionResponse = { error: string }
type PredictionResponse = ValidOrEmptyPredictionResponse | ErrorPredictionResponse

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
  const { scopeID, providerID, apiKey } = await CredentialsForProvider(scopeIDs, provider, modelToCheck)
  if (provider !== DefaultProvider && !apiKey) {
    const { apiKey: defaultModelsAPIKey } = modelToCheck ? await CredentialsForProvider(scopeIDs, provider) : { apiKey }
    return ErrorRunResponse(defaultModelsAPIKey ? 'Unsupported model' : 'Missing API key')
  }
  if (!(await CheckBudgetForProvider(scopeID, provider))) {
    return ErrorRunResponse('Monthly usage limit exceeded')
  }

  const predictor = GetPredictor(provider, apiKey ?? '', userID, config.model)

  let result: PredictionResponse = EmptyRunResponse()
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

  if (!isErrorPredictionResponse(result)) {
    IncrementProviderCost(scopeID, providerID, config.model, result.cost)
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
