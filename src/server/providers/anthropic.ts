import { AnthropicLanguageModel } from '@/types'
import Anthropic from '@anthropic-ai/sdk'
import { Predictor, PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { CostForModel } from './integration'

export default function predict(apiKey: string, model: AnthropicLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks, abortSignal) =>
    complete(apiKey, model, prompts.main, temperature, maxTokens, context, useContext, abortSignal, streamChunks)
}

async function complete(
  apiKey: string,
  model: AnthropicLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  abortSignal: AbortSignal,
  streamChunks?: (text: string) => void
) {
  if (model === 'claude-instant-1') {
    model = 'claude-instant-1.2' as AnthropicLanguageModel
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const runningContext = usePreviousContext ? context.running ?? '' : ''
    const inputPrompt = `${runningContext}${Anthropic.HUMAN_PROMPT} ${prompt} ${Anthropic.AI_PROMPT}`
    const stream = await anthropic.completions.create(
      {
        model,
        temperature,
        max_tokens_to_sample: maxTokens,
        prompt: inputPrompt,
        stop_sequences: [Anthropic.HUMAN_PROMPT],
        stream: true,
      },
      { signal: abortSignal }
    )

    let output = ''
    for await (const message of stream) {
      const text = message.completion
      output += text
      streamChunks?.(text)
    }

    const [cost, inputTokens, outputTokens] = CostForModel(model, inputPrompt, output)
    context.running = `${inputPrompt}${output}`

    return { output, cost, inputTokens, outputTokens, functionCall: null }
  } catch (error: any) {
    return { error: error?.error?.error?.message ?? 'Unknown error' }
  }
}
