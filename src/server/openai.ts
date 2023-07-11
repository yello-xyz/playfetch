import { OpenAILanguageModel } from '@/types'
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai'
import { StreamResponseData } from './stream'

export default function predict(apiKey: string, userID: number, model: OpenAILanguageModel) {
  return (prompt: string, temperature: number, maxOutputTokens: number) =>
    tryCompleteChat(apiKey, userID, model, prompt, temperature, maxOutputTokens)
}

async function tryCompleteChat(
  apiKey: string,
  userID: number,
  model: OpenAILanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  system?: string
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
      // res.write(text)
    }

    // TODO calculate cost depending on model and total output tokens (unavailable in stream response)
    const totalTokens = 0
    const cost = (totalTokens * 0.06) / 1000

    return { output, cost }
  } catch (error) {
    console.error(error)
    return { output: undefined, cost: 0 }
  }
}
