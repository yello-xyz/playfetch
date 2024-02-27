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
import { ChatCompletionCreateParams } from 'openai/resources/chat'
import { SupportsJsonMode } from '@/src/common/providerMetadata'

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

type Message = { role: string; content: any; name?: string }

export const buildPromptMessages = (
  previousMessages: any[],
  prompt: string,
  system?: string,
  inputs?: PromptInputs,
  functionRole?: string
): Message[] => {
  const dropSystemPrompt =
    !system || previousMessages.some(message => message.role === 'system' && message.content === system)
  const lastMessage = previousMessages.slice(-1)[0]
  return [
    ...(dropSystemPrompt ? [] : [{ role: 'system', content: system }]),
    buildFunctionMessage(functionRole, lastMessage, inputs) ?? { role: 'user', content: prompt },
  ]
}

export const exportMessageContent = (message: Message) =>
  typeof message.content === 'string' ? message.content : JSON.stringify(message)

const buildFunctionMessage = (role = 'function', lastMessage?: any, inputs?: PromptInputs): Message | undefined => {
  if (lastMessage && inputs && lastMessage.role === 'assistant' && lastMessage.function_call?.name) {
    const name = lastMessage.function_call.name
    const response = inputs[name]
    if (response) {
      const content = typeof response === 'string' ? response : JSON.stringify(response)
      return { role, name, content }
    }
  }
  return undefined
}

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
  let functions = [] as ChatCompletionCreateParams.Function[]
  if (functionsPrompt) {
    try {
      functions = JSON.parse(functionsPrompt)
      if (!Array.isArray(functions)) {
        functions = [functions]
      }
    } catch (error: any) {
      return { error: `Failed to parse functions as JSON array.\n${error?.message ?? ''}` }
    }
  }

  try {
    const api = new OpenAI({ apiKey })
    const previousMessages = useContext ? context?.messages ?? [] : []
    const promptMessages = buildPromptMessages(previousMessages, prompt, system, continuationInputs)
    const inputMessages = [...previousMessages, ...promptMessages]
    const previousFunctions: any[] = useContext ? context?.functions ?? [] : []
    const serializedPreviousFunctions = new Set(previousFunctions.map(f => JSON.stringify(f)))
    const newFunctions = functions.filter(f => !serializedPreviousFunctions.has(JSON.stringify(f)))
    const inputFunctions = [...previousFunctions, ...newFunctions]
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

    let output = ''
    let isFunctionCall = false
    for await (const message of response) {
      let text = ''

      const choice = message.choices[0]
      const functionCall = choice.delta?.function_call

      if (functionCall) {
        isFunctionCall = true
        if (functionCall.name) {
          text = `{\n  "function": {\n    "name": "${functionCall.name}",\n    "arguments": `
        }
        text += functionCall.arguments?.replaceAll('\n', '\n    ')
      } else {
        text = choice.delta?.content ?? ''
      }

      output += text
      streamChunks?.(text)
    }

    let functionMessage = undefined
    if (isFunctionCall) {
      const suffix = '\n  }\n}\n'
      output += suffix
      streamChunks?.(suffix)
      const functionCall = JSON.parse(output).function
      functionMessage = {
        role: 'assistant',
        content: null,
        function_call: { name: functionCall.name, arguments: JSON.stringify(functionCall.arguments) },
      }
    }

    const [cost, inputTokens, outputTokens] = CostForModel(
      model,
      [...inputMessages, ...inputFunctions].map(exportMessageContent).join('\n'),
      output
    )
    context.messages = [...inputMessages, functionMessage ?? { role: 'assistant', content: output }]
    context.functions = inputFunctions

    return { output, cost, inputTokens, outputTokens, functionCall: functionMessage?.function_call?.name ?? null }
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
