import { OpenAILanguageModel, PromptInputs } from '@/types'
import { ChatCompletionFunctions, Configuration, OpenAIApi } from 'openai'
import { StreamResponseData } from '../stream'
import { encode } from 'gpt-3-encoder'
import { Predictor, PromptContext } from '../promptEngine'

export default function predict(apiKey: string, userID: number, model: OpenAILanguageModel): Predictor {
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

const costForTokensWithModel = (model: OpenAILanguageModel, input: string, output: string) => {
  const inputTokens = encode(input).length
  const outputTokens = encode(output).length
  switch (model) {
    case 'gpt-3.5-turbo':
      return (inputTokens * 0.0015) / 1000 + (outputTokens * 0.002) / 1000
    case 'gpt-4':
      return (inputTokens * 0.03) / 1000 + (outputTokens * 0.06) / 1000
  }
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
  model: OpenAILanguageModel,
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
  let functions = [] as ChatCompletionFunctions[]
  if (functionsPrompt) {
    try {
      functions = JSON.parse(functionsPrompt)
    } catch (error: any) {
      return { error: `Failed to parse functions as JSON array.\n${error?.message ?? ''}` }
    }
  }

  try {
    const api = new OpenAIApi(new Configuration({ apiKey }))
    const previousMessages = useContext ? context?.messages ?? [] : []
    const promptMessages = buildPromptMessages(previousMessages, prompt, system, continuationInputs)
    const previousFunctions = useContext ? context?.functions ?? [] : []
    const response = await api.createChatCompletion(
      {
        model,
        messages: [...previousMessages, ...promptMessages],
        temperature,
        max_tokens: maxTokens,
        user: userID.toString(),
        stream: true,
        functions: previousFunctions.length || functions.length ? [...previousFunctions, ...functions] : undefined,
      },
      { responseType: 'stream', timeout: 30 * 1000 }
    )

    let output = ''
    let isFunctionCall = false
    for await (const message of StreamResponseData(response.data)) {
      let text = ''

      const parsed = JSON.parse(message)
      const choice = parsed.choices[0]
      const functionCall = choice.delta?.function_call

      if (functionCall) {
        isFunctionCall = true
        if (functionCall.name) {
          text = `{\n  "function": {\n    "name": "${functionCall.name}",\n    "arguments": `
        }
        text += functionCall.arguments.replaceAll('\n', '\n    ')
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

    const cost = costForTokensWithModel(model, system ? `${system} ${prompt}` : prompt, output)
    context.messages = [
      ...previousMessages,
      ...promptMessages,
      functionMessage ?? { role: 'assistant', content: output },
    ]
    context.functions = [...previousFunctions, ...functions]

    return { output, cost, interrupted: isFunctionCall }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}