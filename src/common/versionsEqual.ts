import { SupportsFunctionsPrompt, SupportsSystemPrompt } from '@/src/common/providerMetadata'
import { ChainItemWithInputs, PromptConfig, Prompts } from '@/types'

const normalizeItems = (items: ChainItemWithInputs[]) =>
  JSON.stringify(
    items.map(item =>
      Object.entries(item)
        .filter(([, b]) => b !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
    )
  )

export const ChainVersionsAreEqual = (a: { items: ChainItemWithInputs[] }, b: { items: ChainItemWithInputs[] }) =>
  normalizeItems(a.items) === normalizeItems(b.items)

export const PromptConfigsAreEqual = (a: PromptConfig, b: PromptConfig) =>
  a.model === b.model &&
  a.isChat === b.isChat &&
  a.temperature === b.temperature &&
  a.maxTokens === b.maxTokens &&
  a.seed === b.seed

export const PromptVersionsAreEqual = (
  a: { prompts: Prompts; config: PromptConfig },
  b: { prompts: Prompts; config: PromptConfig }
) =>
  a.prompts.main === b.prompts.main &&
  PromptConfigsAreEqual(a.config, b.config) &&
  (!SupportsSystemPrompt(a.config.model) || (a.prompts.system ?? '') === (b.prompts.system ?? '')) &&
  (!SupportsFunctionsPrompt(a.config.model) || (a.prompts.functions ?? '') === (b.prompts.functions ?? ''))

export const VersionHasNonEmptyPrompts = (version: { prompts: Prompts; config: PromptConfig }) =>
  version.prompts.main.trim().length > 0 ||
  (SupportsSystemPrompt(version.config.model) && version.prompts.system && version.prompts.system.trim().length > 0) ||
  (SupportsFunctionsPrompt(version.config.model) &&
    version.prompts.functions &&
    version.prompts.functions.trim().length > 0)

export const PromptVersionMatchesFilter = (version: { prompts: Prompts; config: PromptConfig }, filter: string) =>
  version.prompts.main.toLowerCase().includes(filter) ||
  (SupportsSystemPrompt(version.config.model) &&
    version.prompts.system &&
    version.prompts.system.toLowerCase().includes(filter)) ||
  (SupportsFunctionsPrompt(version.config.model) &&
    version.prompts.functions &&
    version.prompts.functions.toLowerCase().includes(filter))
