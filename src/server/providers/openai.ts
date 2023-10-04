import { CustomLanguageModel, OpenAILanguageModel, PromptInputs } from '@/types'
import OpenAI from 'openai'
import { Predictor, PromptContext } from '../promptEngine'
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
    } catch (error: any) {
      return { error: `Failed to parse functions as JSON array.\n${error?.message ?? ''}` }
    }
  }

  try {
    const api = new OpenAI({ apiKey })
    const previousMessages = useContext ? context?.messages ?? [] : []
    const promptMessages = buildPromptMessages(previousMessages, prompt, system, continuationInputs)
    const previousFunctions = useContext ? context?.functions ?? [] : []
    const response = await api.chat.completions.create(
      {
        model,
        messages: [...previousMessages, ...promptMessages],
        temperature,
        max_tokens: maxTokens,
        user: userID.toString(),
        stream: true,
        functions: previousFunctions.length || functions.length ? [...previousFunctions, ...functions] : undefined,
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

    const cost = CostForModel(model, system ? `${system} ${prompt}` : prompt, output)
    context.messages = [
      ...previousMessages,
      ...promptMessages,
      functionMessage ?? { role: 'assistant', content: output },
    ]
    context.functions = [...previousFunctions, ...functions]

    return { output, cost, functionInterrupt: functionMessage?.function_call?.name }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}

export async function loadCustomModels(apiKey: string): Promise<string[]> {
  const api = new OpenAI({ apiKey })
  const response = await api.models.list()
  const supportedRootModel: OpenAILanguageModel = 'gpt-3.5-turbo'
  return response.data.filter(model => model.id.startsWith(`ft:${supportedRootModel}`)).map(model => model.id)
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
