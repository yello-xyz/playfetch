import { MistralLanguageModel, PromptInputs } from '@/types'
import MistralClient, { ResponseFormat } from '@mistralai/mistralai'
import { Predictor, PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { CostForModel } from './integration'
import { buildPromptInputs, postProcessContext, processStreamedResponses } from './openai'

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

const extractFunction = (message?: any) => message?.tool_calls?.[0]?.function
const wrapFunction = (name: string, args: string) => ({
  role: 'assistant',
  content: '',
  tool_calls: [
    {
      id: 'null',
      type: 'function',
      function: { name, arguments: args },
    },
  ],
})

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
      extractFunction
    )
    if (!inputMessages || !inputFunctions) {
      return { error }
    }
    const response = api.chatStream({
      model,
      messages: inputMessages,
      temperature,
      maxTokens,
      randomSeed,
      responseFormat: { type: jsonMode ? 'json_object' : 'text' } as ResponseFormat,
      tools: inputFunctions.map(f => ({ type: 'function', function: f })),
    })

    const { output, functionMessage } = await processStreamedResponses(
      response,
      extractFunction,
      wrapFunction,
      streamChunks
    )
    const inputForCostCalculation = postProcessContext(inputMessages, inputFunctions, output, functionMessage, context)
    const [cost, inputTokens, outputTokens] = CostForModel(model, inputForCostCalculation, output)

    return {
      output,
      cost,
      inputTokens,
      outputTokens,
      functionCall: extractFunction(functionMessage)?.name ?? null,
    }
  } catch (error: any) {
    return { error: error?.message ?? 'Unknown error' }
  }
}
