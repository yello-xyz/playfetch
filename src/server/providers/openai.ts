import {
  CustomLanguageModel,
  DefaultLanguageModel,
  OpenAIEmbeddingModel,
  OpenAILanguageModel,
  PromptInputs,
} from '@/types'
import OpenAI from 'openai'
import { Predictor, PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { CostForModel } from './integration'
import { SupportsJsonMode } from '@/src/common/providerMetadata'
import { buildFunctionInputs, postProcessFunctionMessage, processFunctionResponse } from './functions'

export default function predict(
  apiKey: string,
  userID: number,
  model: OpenAILanguageModel | CustomLanguageModel
): Predictor {
  return (
    prompts,
    temperature,
    maxTokens,
    context,
    useContext,
    streamChunks,
    abortSignal,
    seed,
    jsonMode,
    continuationInputs
  ) =>
    complete(
      apiKey,
      userID,
      model,
      prompts.main,
      prompts.system,
      prompts.functions,
      temperature,
      maxTokens,
      seed,
      jsonMode,
      context,
      useContext,
      abortSignal,
      streamChunks,
      continuationInputs
    )
}

const extractFunction = (message?: any) => message?.function_call
const wrapFunction = (name: string, args: string) => ({
  role: 'assistant',
  content: null,
  function_call: { name, arguments: args },
})

async function complete(
  apiKey: string,
  userID: number,
  model: OpenAILanguageModel | CustomLanguageModel,
  prompt: string,
  system: string | undefined,
  functionsPrompt: string | undefined,
  temperature: number,
  maxTokens: number,
  seed: number | undefined,
  jsonMode: boolean | undefined,
  context: PromptContext,
  useContext: boolean,
  abortSignal: AbortSignal,
  streamChunks?: (chunk: string) => void,
  continuationInputs?: PromptInputs
) {
  if (model === 'gpt-3.5-turbo-16k') {
    // TODO remove this when the former points to the latter (should be February 16 2024)
    model = 'gpt-3.5-turbo-0125'
  } else if (model === 'gpt-3.5-turbo') {
    // TODO starting February 16 2024, both aliases will point to the latest model (cheaper 16k).
    // There is probably not much point in keeping gpt-3.5-turbo around after that (or using it),
    // but for now we keep it pointing to the same model as before (to be discontinued in June).
    model = 'gpt-3.5-turbo-0613'
  } else if (model === 'gpt-4-turbo') {
    // TODO remove this once the model is generally available (also update model description)
    model = 'gpt-4-0125-preview'
  }

  try {
    const api = new OpenAI({ apiKey })
    const { inputMessages, inputFunctions, error } = buildFunctionInputs(
      prompt,
      system,
      functionsPrompt,
      context,
      useContext,
      continuationInputs,
      'function',
      extractFunction
    )
    if (!inputMessages || !inputFunctions) {
      return { error }
    }
    const response = await api.chat.completions.create(
      {
        model,
        messages: inputMessages,
        temperature,
        max_tokens: maxTokens,
        user: userID.toString(),
        stream: true,
        functions: inputFunctions.length > 0 ? inputFunctions : undefined,
        seed,
        ...(SupportsJsonMode(model) && !!jsonMode ? { response_format: { type: 'json_object' } } : {}),
      },
      { timeout: 30 * 1000, signal: abortSignal }
    )

    const { output, functionMessage } = await processFunctionResponse(
      response,
      extractFunction,
      wrapFunction,
      streamChunks
    )
    const inputForCostCalculation = postProcessFunctionMessage(
      inputMessages,
      inputFunctions,
      output,
      functionMessage,
      context
    )
    const [cost, inputTokens, outputTokens] = CostForModel(model, inputForCostCalculation, output)

    return { output, cost, inputTokens, outputTokens, functionCall: extractFunction(functionMessage)?.name ?? null }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}

export async function loadExtraModels(
  apiKey: string
): Promise<{ customModels: string[]; gatedModels: DefaultLanguageModel[] }> {
  const models: OpenAI.Models.Model[] = []
  try {
    const api = new OpenAI({ apiKey })
    const response = await api.models.list()
    models.push(...response.data)
  } catch (error: any) {
    console.error('Failed to load OpenAI models:', error.message)
  }

  const supportedRootModel: OpenAILanguageModel = 'gpt-3.5-turbo'
  const customModels = models.filter(model => model.id.startsWith(`ft:${supportedRootModel}`)).map(model => model.id)

  const supportedGatedModels: OpenAILanguageModel[] = [] // used to contain 'gpt-4-32k'
  const gatedModels = models
    .filter(model => (supportedGatedModels as string[]).includes(model.id))
    .map(model => model.id) as DefaultLanguageModel[]

  return { customModels, gatedModels }
}

export async function createEmbedding(
  apiKey: string,
  userID: number,
  model: OpenAIEmbeddingModel,
  input: string
): Promise<{ embedding: number[]; cost: number; inputTokens: number }> {
  const api = new OpenAI({ apiKey })

  const response = await api.embeddings.create({ input, model, user: userID.toString() })

  const embedding = response.data[0].embedding
  const [cost, inputTokens] = CostForModel(model, input)

  return { embedding, cost, inputTokens }
}
