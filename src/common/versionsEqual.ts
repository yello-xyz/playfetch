import { SupportsSystemPrompt } from '@/components/modelSelector'
import { ChainItemWithInputs, PromptConfig, Prompts } from '@/types'

export const PromptConfigsAreEqual = (a: PromptConfig, b: PromptConfig) =>
  a.provider === b.provider && a.model === b.model && a.temperature === b.temperature && a.maxTokens === b.maxTokens

export const PromptVersionsAreEqual = (
  a: { prompts: Prompts; config: PromptConfig },
  b: { prompts: Prompts; config: PromptConfig }
) =>
  a.prompts.main === b.prompts.main &&
  PromptConfigsAreEqual(a.config, b.config) &&
  (!SupportsSystemPrompt(a.config.model) || (a.prompts.system ?? '') === (b.prompts.system ?? ''))

export const ChainVersionsAreEqual = (a: { items: ChainItemWithInputs[] }, b: { items: ChainItemWithInputs[] }) =>
  JSON.stringify(a.items) === JSON.stringify(b.items)

export const VersionHasNonEmptyPrompts = (version: { prompts: Prompts; config: PromptConfig }) =>
  version.prompts.main.trim().length > 0 ||
  (SupportsSystemPrompt(version.config.model) && version.prompts.system && version.prompts.system.trim().length > 0)

export const PromptVersionMatchesFilter = (version: { prompts: Prompts; config: PromptConfig }, filter: string) =>
  version.prompts.main.toLowerCase().includes(filter) ||
  (SupportsSystemPrompt(version.config.model) &&
    version.prompts.system &&
    version.prompts.system.toLowerCase().includes(filter))
