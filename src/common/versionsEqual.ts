import { PromptConfig } from '@/types'

export const VersionsEqual = (
  a: { prompt: string; config: PromptConfig },
  b: { prompt: string; config: PromptConfig }
) =>
  a.prompt === b.prompt &&
  a.config.provider === b.config.provider &&
  a.config.model === b.config.model &&
  a.config.temperature === b.config.temperature &&
  a.config.maxTokens === b.config.maxTokens
