import { OpenAILanguageModel } from '@/types'
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai'
import { StreamResponseData } from './stream'
import { encode } from 'gpt-3-encoder'

export default function predict(
  apiKey: string,
  userID: number,
  model: OpenAILanguageModel,
  streamChunks?: (chunk: string) => void
) {
  return (prompt: string, temperature: number, maxOutputTokens: number) =>
    tryCompleteChat(apiKey, userID, model, prompt, temperature, maxOutputTokens, undefined, streamChunks)
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
  streamChunks?: (chunk: string) => void
) {
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
      },
      { responseType: 'stream', timeout: 30 * 1000 }
    )

    let output = ''
    for await (const message of StreamResponseData(response.data)) {
      const parsed = JSON.parse(message)
      const text = parsed.choices[0].delta?.content ?? ''
      output += text
      streamChunks?.(text)
    }

    const cost = costForTokensWithModel(model, system ? `${system} ${prompt}` : prompt, output)

    return { output, cost }
  } catch (error) {
    console.error(error)
    return { output: undefined, cost: 0 }
  }
}
