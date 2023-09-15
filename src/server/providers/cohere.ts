import { CohereLanguageModel } from '@/types'
import cohere from 'cohere-ai'
import { encode } from 'gpt-3-encoder'
import { Predictor, PromptContext } from '../promptEngine'

const calculateCost = (input: string, output: string) => {
  const inputTokens = encode(input).length
  const outputTokens = encode(output).length
  return ((inputTokens + outputTokens) * 15) / 1000000
}

export default function predict(apiKey: string, model: CohereLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks) =>
    complete(apiKey, model, prompts.main, temperature, maxTokens, context, useContext, streamChunks)
}

async function complete(
  apiKey: string,
  model: CohereLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (text: string) => void
) {
  try {
    cohere.init(apiKey)
    const runningContext = usePreviousContext ? context.running ?? '' : ''
    const response = await cohere.generate({
      model,
      prompt: `${runningContext}${prompt}`,
      temperature,
      max_tokens: maxTokens,
    })

    const output = response.body?.generations?.[0]?.text ?? undefined
    if (output && streamChunks) {
      streamChunks(output)
    }

    const cost = calculateCost(prompt, output)
    context.running = `${runningContext}${prompt}\n${output}\n`

    return { output, cost }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
