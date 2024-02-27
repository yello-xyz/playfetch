import { MistralLanguageModel } from '@/types'
import MistralClient, { ResponseFormat } from '@mistralai/mistralai'
import { Predictor, PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { CostForModel } from './integration'
import { buildPromptMessages, exportMessageContent } from './openai'

export default function predict(apiKey: string, model: MistralLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks, _, seed, jsonMode) =>
    complete(apiKey, model, prompts.main, temperature, maxTokens, seed, jsonMode, context, useContext, streamChunks)
}

async function complete(
  apiKey: string,
  model: MistralLanguageModel,
  prompt: string,
  temperature: number,
  maxTokens: number,
  randomSeed: number | undefined,
  jsonMode: boolean | undefined,
  context: PromptContext,
  usePreviousContext: boolean,
  streamChunks?: (text: string) => void
) {
  try {
    const api = new MistralClient(apiKey)
    const previousMessages = usePreviousContext ? context?.messages ?? [] : []
    const promptMessages = buildPromptMessages(previousMessages, prompt)
    const inputMessages = [...previousMessages, ...promptMessages]
    const stream = api.chatStream({
      model,
      messages: inputMessages,
      temperature,
      maxTokens,
      randomSeed,
      responseFormat: { type: (jsonMode ? 'json_object' : 'text') } as ResponseFormat,
    })

    let output = ''
    for await (const message of stream) {
      const text = message.choices[0].delta.content
      if (text) {
        output += text
        streamChunks?.(text)
      }
    }

    const [cost, inputTokens, outputTokens] = CostForModel(
      model,
      inputMessages.map(exportMessageContent).join('\n'),
      output
    )
    context.messages = [...inputMessages, { role: 'assistant', content: output }]

    return { output, cost, inputTokens, outputTokens, functionCall: null }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
