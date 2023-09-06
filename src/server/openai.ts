import { OpenAILanguageModel, PromptInputs } from '@/types'
import { ChatCompletionFunctions, Configuration, OpenAIApi } from 'openai'
import { StreamResponseData } from './stream'
import { encode } from 'gpt-3-encoder'
import { Predictor, PromptContext } from './promptEngine'

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

const buildPromptMessages = (prompt: string, system?: string, lastMessage?: any, inputs?: PromptInputs) => [
  ...(system ? [{ role: 'system', content: system }] : []),
  ...(lastMessage &&
  lastMessage.role === 'assistant' &&
  lastMessage.function_call?.name &&
  inputs &&
  inputs[lastMessage.function_call.name] !== undefined
    ? [{ role: 'function', name: lastMessage.function_call.name, content: inputs[lastMessage.function_call.name] }]
    : [{ role: 'user', content: prompt }]),
]

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
    const runningMessages = useContext ? context?.messages ?? [] : []
    const promptMessages = buildPromptMessages(prompt, system, runningMessages.slice(-1)[0], continuationInputs)
    const runningFunctions = useContext ? context?.functions ?? [] : []
    const response = await api.createChatCompletion(
      {
        model,
        messages: [...runningMessages, ...promptMessages],
        temperature,
        max_tokens: maxTokens,
        user: userID.toString(),
        stream: true,
        functions: runningFunctions.length || functions.length ? [...runningFunctions, ...functions] : undefined,
      },
      { responseType: 'stream', timeout: 30 * 1000 }
    )

    let output = ''
    let functionMessage = undefined
    for await (const message of StreamResponseData(response.data)) {
      let text = ''

      const parsed = JSON.parse(message)
      const choice = parsed.choices[0]
      const functionCall = choice.delta?.function_call

      if (functionCall) {
        if (functionCall.name) {
          text = `{\n  "function": {\n    "name": "${functionCall.name}",\n    "arguments": `
        }
        text += functionCall.arguments.replaceAll('\n', '\n    ')
      } else if (choice.finish_reason === 'function_call') {
        text = '\n  }\n}\n'
        const functionCall = JSON.parse(output + text).function
        functionMessage = {
          role: 'assistant',
          content: null,
          function_call: { name: functionCall.name, arguments: JSON.stringify(functionCall.arguments) },
        }
      } else {
        text = choice.delta?.content ?? ''
      }

      output += text
      streamChunks?.(text)
    }

    const cost = costForTokensWithModel(model, system ? `${system} ${prompt}` : prompt, output)
    context.messages = [
      ...runningMessages,
      ...promptMessages,
      functionMessage ?? { role: 'assistant', content: output },
    ]
    context.functions = [...runningFunctions, ...functions]

    return { output, cost, interrupted: !!functionMessage }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
