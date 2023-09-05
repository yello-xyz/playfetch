import { AnthropicLanguageModel } from '@/types'
import Anthropic from '@anthropic-ai/sdk'
import { Predictor } from './promptEngine'

const calculateCost = (prompt: string, result: string) =>
  (prompt.length * 4.6) / 1000000 + (result.length * 13.8) / 1000000

export default function predict(apiKey: string, model: AnthropicLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, streamChunks) =>
    complete(apiKey, model, prompts.main, temperature, maxTokens, streamChunks)
}

async function complete(
  apiKey: string,
  model: AnthropicLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  streamChunks?: (text: string) => void
) {
  try {
    const anthropic = new Anthropic({ apiKey })
    const formattedPrompt = `${Anthropic.HUMAN_PROMPT} ${prompt} ${Anthropic.AI_PROMPT}`
    const stream = await anthropic.completions.create({
      model,
      temperature,
      max_tokens_to_sample: maxTokens,
      prompt: formattedPrompt,
      stop_sequences: [Anthropic.HUMAN_PROMPT],
      stream: true,
    })

    let output = ''
    for await (const message of stream) {
      const text = message.completion
      output += text
      streamChunks?.(text)
    }

    const cost = calculateCost(formattedPrompt, output)

    return { output, cost }
  } catch (error: any) {
    return { error: error?.error?.error?.message ?? 'Unknown error' }
  }
}
