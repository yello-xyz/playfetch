import { ChainItemWithInputs, PromptConfig } from '@/types'

export const PromptConfigsEqual = (a: PromptConfig, b: PromptConfig) =>
  a.provider === b.provider && a.model === b.model && a.temperature === b.temperature && a.maxTokens === b.maxTokens

export const PromptVersionsEqual = (
  a: { prompt: string; config: PromptConfig },
  b: { prompt: string; config: PromptConfig }
) => a.prompt === b.prompt && PromptConfigsEqual(a.config, b.config)

export const ChainVersionsEqual = (a: { items: ChainItemWithInputs[] }, b: { items: ChainItemWithInputs[] }) =>
  JSON.stringify(a.items) === JSON.stringify(b.items)
