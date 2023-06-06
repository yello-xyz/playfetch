import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai'

const getAPI = () => new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))

export default async function predict(prompt: string, temperature: number, maxOutputTokens: number) {
  const attempts = 3
  for (let attempt = 0; attempt < attempts; attempt++) {
    const completion = await tryCompleteChat('', temperature, maxOutputTokens, prompt)
    if (completion?.length) {
      return completion
    }
  }
  return undefined
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
    console.log(`OpenAI cost < $${upperBoundCost.toFixed(3)}`)
    return response.data.choices[0]?.message?.content?.trim()
  } catch (error) {
    console.error(error)
    return undefined
  }
}
