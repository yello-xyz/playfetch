import { PromptInputs, Prompts } from '@/types'
import { DefaultChatContinuationInputKey, ExtractVariables, ToCamelCase } from '@/src/common/formatting'

const promptToCamelCase = (prompt: string) =>
  ExtractVariables(prompt).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
    prompt
  )

const resolveVariables = (prompt: string, inputs: PromptInputs) =>
  ExtractVariables(prompt).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, inputs[variable] ?? ''),
    prompt
  )

export const resolvePrompt = (prompt: string, inputs: PromptInputs, useCamelCase: boolean) =>
  resolveVariables(useCamelCase ? promptToCamelCase(prompt) : prompt, inputs)

const getReplyPromptFromInputs = (inputs: PromptInputs): Prompts => ({
  main: inputs[DefaultChatContinuationInputKey] ?? Object.values(inputs)[0],
})

export const resolvePrompts = (
  prompts: Prompts,
  inputs: PromptInputs,
  useCamelCase: boolean,
  isContinuedChat: boolean
) =>
  isContinuedChat
    ? getReplyPromptFromInputs(inputs)
    : (Object.fromEntries(
        Object.entries(prompts).map(([key, value]) => [key, resolvePrompt(value, inputs, useCamelCase)])
      ) as Prompts)

export const AugmentInputs = (
  inputs: PromptInputs,
  variable: string | undefined,
  value: string,
  useCamelCase: boolean
) => (variable ? { ...inputs, [useCamelCase ? ToCamelCase(variable) : variable]: value } : inputs)
