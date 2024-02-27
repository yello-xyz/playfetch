import { MistralLanguageModel, PromptInputs } from '@/types'
import MistralClient, { ResponseFormat, ToolCalls } from '@mistralai/mistralai'
import { Predictor, PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { CostForModel } from './integration'
import { buildPromptInputs, exportMessageContent } from './openai'

export default function predict(apiKey: string, model: MistralLanguageModel): Predictor {
  return (prompts, temperature, maxTokens, context, useContext, streamChunks, _, seed, jsonMode, continuationInputs) =>
    complete(
      apiKey,
      model,
      prompts.main,
      prompts.system,
      prompts.functions,
      temperature,
      maxTokens,
      seed,
      jsonMode,
      context,
      useContext,
      streamChunks,
      continuationInputs
    )
}

const extractFunctionName = (message?: any) => message?.tool_calls?.[0]?.function?.name

async function complete(
  apiKey: string,
  model: MistralLanguageModel,
  prompt: string,
  system: string | undefined,
  functionsPrompt: string | undefined,
  temperature: number,
  maxTokens: number,
  randomSeed: number | undefined,
  jsonMode: boolean | undefined,
  context: PromptContext,
  useContext: boolean,
  streamChunks?: (text: string) => void,
  continuationInputs?: PromptInputs
) {
  try {
    const api = new MistralClient(apiKey)
    const { inputMessages, inputFunctions, error } = buildPromptInputs(
      prompt,
      system,
      functionsPrompt,
      context,
      useContext,
      continuationInputs,
      'tool',
      extractFunctionName
    )
    if (!inputMessages || !inputFunctions) {
      return { error }
    }
    const stream = api.chatStream({
      model,
      messages: inputMessages,
      temperature,
      maxTokens,
      randomSeed,
      responseFormat: { type: jsonMode ? 'json_object' : 'text' } as ResponseFormat,
      tools: inputFunctions.map(f => ({ type: 'function', function: f })),
    })

    let output = ''
    let isFunctionCall = false
    for await (const message of stream) {
      let text = ''

      const choice = message.choices[0]
      const functionCall = choice.delta?.tool_calls?.find((c: ToolCalls) => c.type === 'function')?.function

      if (functionCall) {
        isFunctionCall = true
        if (functionCall.name) {
          text = `{\n  "function": {\n    "name": "${functionCall.name}",\n    "arguments": `
        }
        text += functionCall.arguments?.replaceAll('\n', '\n    ')
      } else {
        text = choice.delta?.content ?? ''
      }

      output += text
      streamChunks?.(text)
    }

    let functionMessage = undefined
    if (isFunctionCall) {
      const suffix = '\n  }\n}\n'
      output += suffix
      streamChunks?.(suffix)
      const functionCall = JSON.parse(output).function
      functionMessage = {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: 'null',
            type: 'function',
            function: { name: functionCall.name, arguments: JSON.stringify(functionCall.arguments) },
          },
        ],
      }
    }

    const [cost, inputTokens, outputTokens] = CostForModel(
      model,
      [...inputMessages, ...inputFunctions].map(exportMessageContent).join('\n'),
      output
    )
    context.messages = [...inputMessages, functionMessage ?? { role: 'assistant', content: output }]
    context.functions = inputFunctions

    return {
      output,
      cost,
      inputTokens,
      outputTokens,
      functionCall: extractFunctionName(functionMessage) ?? null,
    }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
