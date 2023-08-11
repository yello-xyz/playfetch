import { CohereLanguageModel } from '@/types'
import cohere from 'cohere-ai'
import { encode } from 'gpt-3-encoder'

const calculateCost = (input: string, output: string) => {
  const inputTokens = encode(input).length
  const outputTokens = encode(output).length
  return ((inputTokens + outputTokens) * 15) / 1000000
}

export default function predict(apiKey: string, model: CohereLanguageModel) {
  return (prompt: string, temperature: number, maxTokens: number, streamChunks?: (text: string) => void) =>
    complete(apiKey, model, prompt, temperature, maxTokens, streamChunks)
}

async function complete(
  apiKey: string,
  model: CohereLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  streamChunks?: (text: string) => void
) {
  try {
    cohere.init(apiKey)
    const response = await cohere.generate({
      model,
      prompt,
      temperature,
      max_tokens: maxTokens,
    })

    const output = response.body?.generations?.[0]?.text ?? undefined
    if (output && streamChunks) {
      streamChunks(output)
    }

    const cost = calculateCost(prompt, output)

    return { output, cost }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
