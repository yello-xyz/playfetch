import { ChainItemWithInputs, PromptConfig, Prompts } from '@/types'

export const PromptConfigsAreEqual = (a: PromptConfig, b: PromptConfig) =>
  a.provider === b.provider && a.model === b.model && a.temperature === b.temperature && a.maxTokens === b.maxTokens

export const PromptVersionsAreEqual = (
  a: { prompts: Prompts; config: PromptConfig },
  b: { prompts: Prompts; config: PromptConfig }
) =>
  a.prompts.main === b.prompts.main &&
  (a.prompts.system ?? '') === (b.prompts.system ?? '') &&
  PromptConfigsAreEqual(a.config, b.config)

export const ChainVersionsAreEqual = (a: { items: ChainItemWithInputs[] }, b: { items: ChainItemWithInputs[] }) =>
  JSON.stringify(a.items) === JSON.stringify(b.items)

export const VersionHasNonEmptyPrompts = (version: { prompts: Prompts }) =>
  version.prompts.main.trim().length || version.prompts.system?.trim()?.length

export const PromptVersionMatchesFilter = (version: { prompts: Prompts }, filter: string) =>
  version.prompts.main.toLowerCase().includes(filter) || version.prompts.system?.toLowerCase()?.includes(filter)
