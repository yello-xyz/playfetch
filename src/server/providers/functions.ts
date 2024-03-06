import { PromptInputs } from '@/types'
import { PromptContext } from '@/src/server/evaluationEngine/promptEngine'
import { ChatCompletionResponseChunk } from '@mistralai/mistralai'
import { ChatCompletionChunk, ChatCompletionCreateParams } from 'openai/resources/chat'
import { Stream } from 'openai/streaming'

type Message = { role: string; content: any; name?: string }

const buildFunctionMessage = (
  lastMessage: any | undefined,
  inputs: PromptInputs | undefined,
  role: string,
  extractFunction: (message?: any) => any | undefined
): Message | undefined => {
  const name = extractFunction(lastMessage)?.name
  if (lastMessage && inputs && lastMessage.role === 'assistant' && name) {
    const response = inputs[name]
    if (response) {
      const content = typeof response === 'string' ? response : JSON.stringify(response)
      return { role, name, content }
    }
  }
  return undefined
}

const buildPromptMessages = (
  previousMessages: any[],
  prompt: string,
  system: string | undefined,
  inputs: PromptInputs | undefined,
  functionRole: string,
  extractFunction: (message?: any) => any | undefined
): Message[] => {
  const dropSystemPrompt =
    !system || previousMessages.some(message => message.role === 'system' && message.content === system)
  const lastMessage = previousMessages.slice(-1)[0]
  return [
    ...(dropSystemPrompt ? [] : [{ role: 'system', content: system }]),
    buildFunctionMessage(lastMessage, inputs, functionRole, extractFunction) ?? { role: 'user', content: prompt },
  ]
}

export const buildFunctionInputs = (
  prompt: string,
  system: string | undefined,
  functionsPrompt: string | undefined,
  context: PromptContext,
  useContext: boolean,
  continuationInputs: PromptInputs | undefined,
  functionRole: string,
  extractFunction: (message: any) => any | undefined
) => {
  let functions = [] as ChatCompletionCreateParams.Function[]
  if (functionsPrompt) {
    try {
      functions = JSON.parse(functionsPrompt)
      if (!Array.isArray(functions)) {
        functions = [functions]
      }
    } catch (error: any) {
      return { error: `Failed to parse functions as JSON array.\n${error?.message ?? ''}` }
    }
  }

  const previousMessages = useContext ? context?.messages ?? [] : []
  const promptMessages = buildPromptMessages(
    previousMessages,
    prompt,
    system,
    continuationInputs,
    functionRole,
    extractFunction
  )
  const inputMessages = [...previousMessages, ...promptMessages]
  const previousFunctions: any[] = useContext ? context?.functions ?? [] : []
  const serializedPreviousFunctions = new Set(previousFunctions.map(f => JSON.stringify(f)))
  const newFunctions = functions.filter(f => !serializedPreviousFunctions.has(JSON.stringify(f)))
  const inputFunctions = [...previousFunctions, ...newFunctions]

  return { inputMessages, inputFunctions }
}

export const processFunctionResponse = async (
  response: Stream<ChatCompletionChunk> | AsyncGenerator<ChatCompletionResponseChunk>,
  extractFunction: (message: any) => any | undefined,
  wrapFunction: (name: string, args: string) => any,
  streamChunks?: (chunk: string) => void
) => {
  let output = ''
  let isFunctionCall = false
  for await (const message of response) {
    let text = ''

    const choice = message.choices[0]
    const functionCall = extractFunction(choice.delta)

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
    functionMessage = wrapFunction(functionCall.name, JSON.stringify(functionCall.arguments))
  }

  return { output, functionMessage }
}

export const postProcessFunctionMessage = (
  inputMessages: any[],
  inputFunctions: any[],
  output: string,
  functionMessage: any | undefined,
  context: PromptContext
) => {
  context.messages = [...inputMessages, functionMessage ?? { role: 'assistant', content: output }]
  context.functions = inputFunctions

  const exportMessageContent = (message: Message) =>
    typeof message.content === 'string' ? message.content : JSON.stringify(message)

  return [...inputMessages, ...inputFunctions].map(exportMessageContent).join('\n')
}
