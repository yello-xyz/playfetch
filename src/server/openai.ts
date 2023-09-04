import { OpenAILanguageModel, Prompts } from '@/types'
import { ChatCompletionFunctions, ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai'
import { StreamResponseData } from './stream'
import { encode } from 'gpt-3-encoder'

export default function predict(apiKey: string, userID: number, model: OpenAILanguageModel) {
  return (prompts: Prompts, temperature: number, maxOutputTokens: number, streamChunks?: (chunk: string) => void) =>
    tryCompleteChat(
      apiKey,
      userID,
      model,
      prompts.main,
      temperature,
      maxOutputTokens,
      prompts.system,
      prompts.functions,
      streamChunks
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

async function tryCompleteChat(
  apiKey: string,
  userID: number,
  model: OpenAILanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  system?: string,
  functionsPrompt?: string,
  streamChunks?: (chunk: string) => void
) {
  let functions = undefined as ChatCompletionFunctions[] | undefined
  if (functionsPrompt) {
    try {
      functions = JSON.parse(functionsPrompt)
    } catch (error: any) {
      return { error: `Failed to parse functions as JSON array.\n${error?.message ?? ''}` }
    }
  }

  try {
    const api = new OpenAIApi(new Configuration({ apiKey }))
    const response = await api.createChatCompletion(
      {
        model,
        messages: [
          ...(system ? [{ role: 'system' as ChatCompletionRequestMessageRoleEnum, content: system }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
        user: userID.toString(),
        stream: true,
        functions,
      },
      { responseType: 'stream', timeout: 30 * 1000 }
    )

    let output = ''
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
      } else {
        text = choice.delta?.content ?? ''
      }

      output += text
      streamChunks?.(text)
    }

    const cost = costForTokensWithModel(model, system ? `${system} ${prompt}` : prompt, output)

    return { output, cost }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
