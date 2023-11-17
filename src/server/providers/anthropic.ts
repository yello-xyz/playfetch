import { AnthropicLanguageModel } from '@/types'
import Anthropic from '@anthropic-ai/sdk'
import { Predictor, PromptContext } from '../evaluationEngine/promptEngine'
import { CostForModel } from './integration'

export default function predict(apiKey: string, model: AnthropicLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks) =>
    complete(apiKey, model, prompts.main, temperature, maxTokens, context, useContext, streamChunks)
}

async function complete(
  apiKey: string,
  model: AnthropicLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (text: string) => void
) {
  try {
    const anthropic = new Anthropic({ apiKey })
    const runningContext = usePreviousContext ? context.running ?? '' : ''
    const inputPrompt = `${runningContext}${Anthropic.HUMAN_PROMPT} ${prompt} ${Anthropic.AI_PROMPT}`
    const stream = await anthropic.completions.create({
      model,
      temperature,
      max_tokens_to_sample: maxTokens,
      prompt: inputPrompt,
      stop_sequences: [Anthropic.HUMAN_PROMPT],
      stream: true,
    })

    let output = ''
    for await (const message of stream) {
      const text = message.completion
      output += text
      streamChunks?.(text)
    }

    const cost = CostForModel(model, inputPrompt, output)
    context.running = `${inputPrompt}${output}`

    return { output, cost }
  } catch (error: any) {
    return { error: error?.error?.error?.message ?? 'Unknown error' }
  }
}
