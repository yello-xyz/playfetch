import { PromptConfig, Prompts } from '@/types'
import { parse, stringify } from 'yaml'

export const serializePromptVersion = (promptVersion: { prompts: Prompts; config: PromptConfig }): string =>
  stringify(promptVersion)

export const deserializePromptVersion = (promptVersion: string): { prompts: Prompts; config: PromptConfig } =>
  parse(promptVersion)
