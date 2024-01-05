import { PromptConfig, Prompts, PromptInputs } from '@/types'
import {
  CheckBudgetForProvider,
  CredentialsForProvider,
  GetPredictor,
  IncrementProviderCost,
} from '../providers/integration'
import { DefaultProvider } from '../../common/defaultConfig'
import { PublicLanguageModels, ProviderForModel } from '../../common/providerMetadata'
import { EmptyRunResponse, ErrorRunResponse, RunResponse, TryParseOutput } from './runResponse'
import { DefaultChatContinuationInputKey } from '@/src/common/formatting'

type ValidOrEmptyPredictionResponse = {
  output: string
  cost: number
  inputTokens: number
  outputTokens: number
  functionCall: string | null
}
type ErrorPredictionResponse = { error: string }
type PredictionResponse = ValidOrEmptyPredictionResponse | ErrorPredictionResponse

export type PromptContext = any
export type Predictor = (
  prompts: Prompts,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks: ((text: string) => void) | undefined,
  seed: number | undefined,
  jsonMode: boolean | undefined,
  continuationInputs: PromptInputs
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
  streamChunks: (chunk: string) => void | undefined,
  continuationInputs: PromptInputs
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
      config.seed,
      config.jsonMode,
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
      ? ErrorRunResponse(result.error)
      : isValidPredictionResponse(result)
      ? {
          ...result,
          result: TryParseOutput(result.output),
          error: undefined,
          failed: false,
          functionCall: result.functionCall ?? (config.isChat ? DefaultChatContinuationInputKey : null),
        }
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
