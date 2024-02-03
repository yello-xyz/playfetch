import { HuggingfaceLanguageModel } from '@/types'
import { HfInference } from '@huggingface/inference'
import { Predictor, PromptContext } from '../evaluationEngine/promptEngine'
import { CostForModel } from './integration'

export default function predict(apiKey: string, model: HuggingfaceLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks, abortSignal) =>
    complete(apiKey, model, prompts.main, temperature, maxTokens, context, useContext, abortSignal, streamChunks)
}

async function complete(
  apiKey: string,
  model: HuggingfaceLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  abortSignal: AbortSignal,
  streamChunks?: (text: string) => void
) {
  try {
    const api = new HfInference(apiKey)
    const runningContext = usePreviousContext ? context.running ?? '' : ''
    const inputPrompt = `${runningContext}${prompt}`
    const stream = api.textGenerationStream({
      model,
      inputs: inputPrompt,
      parameters: { temperature, max_new_tokens: maxTokens },
    }, { signal: abortSignal })

    let output = ''
    for await (const message of stream) {
      const text = message.token.text
      output += text
      streamChunks?.(text)
    }

    const [cost, inputTokens, outputTokens] = CostForModel(model, inputPrompt, output)
    context.running = `${inputPrompt}\n${output}\n`

    return { output, cost, inputTokens, outputTokens, functionCall: null }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
