import { AnthropicLanguageModel } from '@/types'
import Anthropic from '@anthropic-ai/sdk'
import { Predictor, PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { CostForModel } from './integration'

export default function predict(apiKey: string, userID: number, model: AnthropicLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks, abortSignal) =>
    complete(
      apiKey,
      userID,
      model,
      prompts.main,
      prompts.system,
      temperature,
      maxTokens,
      context,
      useContext,
      abortSignal,
      streamChunks
    )
}

type Message = { role: 'user' | 'assistant'; content: string }

async function complete(
  apiKey: string,
  userID: number,
  model: AnthropicLanguageModel,
  prompt: string,
  system: string | undefined,
  temperature: number,
  maxTokens: number,
  context: PromptContext,
  usePreviousContext: boolean,
  abortSignal: AbortSignal,
  streamChunks?: (text: string) => void
) {
  if (model === 'claude-instant-1') {
    model = 'claude-instant-1.2' as AnthropicLanguageModel
  } else if (model === 'claude-2') {
    model = 'claude-2.1' as AnthropicLanguageModel
  } else if (model === 'claude-3-sonnet') {
    model = 'claude-3-sonnet-20240229' as AnthropicLanguageModel
  } else if (model === 'claude-3-opus') {
    model = 'claude-3-opus-20240229' as AnthropicLanguageModel
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const previousMessages: Message[] = usePreviousContext ? context.messages ?? [] : []
    const promptAsMessage: Message = { role: 'user', content: prompt }
    const inputMessages = [...previousMessages, promptAsMessage]
    const stream = anthropic.messages.stream(
      {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: inputMessages,
        system,
        metadata: { user_id: userID.toString() },
      },
      { signal: abortSignal }
    )

    let output = ''
    for await (const message of stream) {
      if (abortSignal.aborted) {
        stream.controller.abort()
        break
      }
      if (message.type === 'content_block_delta') {
        const text = message.delta.text
        output += text
        streamChunks?.(text)
      }
    }

    const inputMessageContent = inputMessages.map(message => message.content).join('\n')
    const [cost, inputTokens, outputTokens] = CostForModel(model, inputMessageContent, output)
    context.messages = [...inputMessages, { role: 'assistant', content: output }]

    return { output, cost, inputTokens, outputTokens, functionCall: null }
  } catch (error: any) {
    return { error: error?.error?.error?.message ?? 'Unknown error' }
  }
}
