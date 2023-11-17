import { CustomLanguageModel, DefaultLanguageModel, OpenAILanguageModel, PromptInputs } from '@/types'
import OpenAI from 'openai'
import { Predictor, PromptContext } from '../evaluationEngine/promptEngine'
import { CostForModel } from './integration'
import { ChatCompletionCreateParams } from 'openai/resources/chat'

export default function predict(
  apiKey: string,
  userID: number,
  model: OpenAILanguageModel | CustomLanguageModel
): Predictor {
  return (prompts, temperature, maxOutputTokens, context, useContext, streamChunks, continuationInputs) =>
    tryCompleteChat(
      apiKey,
      userID,
      model,
      prompts.main,
      prompts.system,
      prompts.functions,
      temperature,
      maxOutputTokens,
      context,
      useContext,
      streamChunks,
      continuationInputs
    )
}

const getFunctionResponseMessage = (lastMessage?: any, inputs?: PromptInputs) => {
  if (lastMessage && inputs && lastMessage.role === 'assistant' && lastMessage.function_call?.name) {
    const name = lastMessage.function_call.name
    const response = inputs[name]
    if (response) {
      const content = typeof response === 'string' ? response : JSON.stringify(response)
      return { role: 'function', name, content }
    }
  }
  return undefined
}

const buildPromptMessages = (previousMessages: any[], prompt: string, system?: string, inputs?: PromptInputs) => {
  const dropSystemPrompt =
    !system || previousMessages.some(message => message.role === 'system' && message.content === system)
  const lastMessage = previousMessages.slice(-1)[0]
  return [
    ...(dropSystemPrompt ? [] : [{ role: 'system', content: system }]),
    getFunctionResponseMessage(lastMessage, inputs) ?? { role: 'user', content: prompt },
  ]
}

async function tryCompleteChat(
  apiKey: string,
  userID: number,
  model: OpenAILanguageModel | CustomLanguageModel,
  prompt: string,
  system: string | undefined,
  functionsPrompt: string | undefined,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  useContext: boolean,
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
    const response = await api.chat.completions.create(
      {
        model: model
          // TODO remove this after Dec 11th (when the former points to the latter)
          .replaceAll('gpt-3.5-turbo-16k', 'gpt-3.5-turbo-1106')
          // TODO remove this once the model is generally available
          .replaceAll('gpt-4-turbo', 'gpt-4-1106-preview'),
        messages: inputMessages,
        temperature,
        max_tokens: maxTokens,
        user: userID.toString(),
        stream: true,
        functions: inputFunctions.length > 0 ? inputFunctions : undefined,
      },
      { timeout: 30 * 1000 }
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

    const extractContent = (obj: any) => (typeof obj.content === 'string' ? obj.content : JSON.stringify(obj))
    const cost = CostForModel(model, [...inputMessages, ...inputFunctions].map(extractContent).join('\n'), output)
    context.messages = [...inputMessages, functionMessage ?? { role: 'assistant', content: output }]
    context.functions = inputFunctions

    return { output, cost, functionInterrupt: functionMessage?.function_call?.name }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}

export async function loadExtraModels(
  apiKey: string
): Promise<{ customModels: string[]; gatedModels: DefaultLanguageModel[] }> {
  const api = new OpenAI({ apiKey })
  const response = await api.models.list()

  const supportedRootModel: OpenAILanguageModel = 'gpt-3.5-turbo'
  const customModels = response.data
    .filter(model => model.id.startsWith(`ft:${supportedRootModel}`))
    .map(model => model.id)

  const supportedGatedModels: OpenAILanguageModel[] = [] // used to contain 'gpt-4-32k'
  const gatedModels = response.data
    .filter(model => (supportedGatedModels as string[]).includes(model.id))
    .map(model => model.id) as DefaultLanguageModel[]

  return { customModels, gatedModels }
}

export async function createEmbedding(
  apiKey: string,
  userID: number,
  model: 'text-embedding-ada-002',
  input: string
): Promise<{ embedding: number[]; cost: number }> {
  const api = new OpenAI({ apiKey })

  const response = await api.embeddings.create({ input, model, user: userID.toString() })

  const embedding = response.data[0].embedding
  const cost = CostForModel(model, input)

  return { embedding, cost }
}
