import { PromptConfig } from '@/types'

export const ConfigsEqual = (a: PromptConfig, b: PromptConfig) =>
  a.provider === b.provider && a.model === b.model && a.temperature === b.temperature && a.maxTokens === b.maxTokens

export const VersionsEqual = (
  a: { prompt: string; config: PromptConfig },
  b: { prompt: string; config: PromptConfig }
) => a.prompt === b.prompt && ConfigsEqual(a.config, b.config)
