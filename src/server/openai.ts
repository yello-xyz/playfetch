import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai'

const getAPI = () => new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))

export default async function predict(prompt: string, temperature: number, maxOutputTokens: number) {
  return tryCompleteChat(prompt, temperature, maxOutputTokens)
}

async function tryCompleteChat(
  prompt: string,
  temperature: number,
  maxTokens: number,
  system?: string,
  userID?: number
) {
  try {
    const response = await getAPI().createChatCompletion(
      {
        model: 'gpt-3.5-turbo',
        messages: [
          ...(system ? [{ role: 'system' as ChatCompletionRequestMessageRoleEnum, content: system }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
        user: userID?.toString() ?? 'playfetch',
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
