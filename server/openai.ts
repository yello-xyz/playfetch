import { Configuration, OpenAIApi } from 'openai'

const getAPI = () => new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }))

export default async function completeChat(system: string, prompt: string, userID: number, attempts: number = 3) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const completion = await tryCompleteChat(system, prompt, userID)
    if (completion?.length) {
      return completion
    }
  }
  return undefined
}

async function tryCompleteChat(system: string, prompt: string, userID: number) {
  try {
    const response = await getAPI().createChatCompletion(
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 1.0,
        user: userID.toString(),
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
