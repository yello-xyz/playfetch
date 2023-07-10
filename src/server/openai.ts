import { OpenAILanguageModel } from '@/types'
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai'

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
      },
      { timeout: 30 * 1000 }
    )
    const totalTokens = response.data.usage?.total_tokens ?? 0
    const upperBoundCost = (totalTokens * 0.06) / 1000
    return { output: response.data.choices[0]?.message?.content?.trim(), cost: upperBoundCost }
  } catch (error) {
    console.error(error)
    return { output: undefined, cost: 0 }
  }
}
