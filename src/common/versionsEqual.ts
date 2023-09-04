import { ChainItemWithInputs, PromptConfig, Prompts } from '@/types'

export const PromptConfigsEqual = (a: PromptConfig, b: PromptConfig) =>
  a.provider === b.provider && a.model === b.model && a.temperature === b.temperature && a.maxTokens === b.maxTokens

export const PromptVersionsEqual = (
  a: { prompts: Prompts; config: PromptConfig },
  b: { prompts: Prompts; config: PromptConfig }
) => a.prompts.main === b.prompts.main && PromptConfigsEqual(a.config, b.config)

export const ChainVersionsEqual = (a: { items: ChainItemWithInputs[] }, b: { items: ChainItemWithInputs[] }) =>
  JSON.stringify(a.items) === JSON.stringify(b.items)
