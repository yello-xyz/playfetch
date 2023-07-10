import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai'
import { getProviderKey } from './datastore/providers'

export default async function predict(prompt: string, temperature: number, maxOutputTokens: number, userID: number) {
  return tryCompleteChat(userID, prompt, temperature, maxOutputTokens)
}

async function tryCompleteChat(
  userID: number,
  prompt: string,
  temperature: number,
  maxTokens: number,
  system?: string,
) {
  try {
    const apiKey = await getProviderKey(userID, 'openai')
    const api = new OpenAIApi(new Configuration({ apiKey }))
    const response = await api.createChatCompletion(
      {
        model: 'gpt-3.5-turbo',
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
