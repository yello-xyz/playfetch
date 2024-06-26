import { PromptConfig, Prompts } from '@/types'
import { DefaultPromptConfig, DefaultPrompts } from '@/src/common/defaults'
import { parse, stringify } from 'yaml'

export const serializePromptVersion = ({
  id,
  prompts,
  config,
}: {
  id?: number
  prompts: Prompts
  config: PromptConfig
}): string =>
  stringify({
    id,
    prompt: prompts.main,
    system: prompts.system,
    functions: prompts.functions,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    seed: config.seed,
    jsonMode: config.jsonMode,
    chatMode: config.isChat || undefined,
  })

export const deserializePromptVersion = (
  promptVersion: string
): { id?: number; prompts: Prompts; config: PromptConfig } => {
  const parsed = parse(promptVersion)
  return {
    ...(parsed.id !== undefined ? { id: parsed.id } : {}),
    prompts: {
      main: parsed.prompt ?? DefaultPrompts.main,
      ...(parsed.system !== undefined ? { system: parsed.system } : {}),
      ...(parsed.functions !== undefined ? { functions: parsed.functions } : {}),
    },
    config: {
      model: parsed.model ?? DefaultPromptConfig.model,
      temperature: parsed.temperature ?? DefaultPromptConfig.temperature,
      maxTokens: parsed.maxTokens ?? DefaultPromptConfig.maxTokens,
      ...(parsed.seed !== undefined ? { seed: parsed.seed } : {}),
      ...(parsed.jsonMode !== undefined ? { jsonMode: parsed.jsonMode } : {}),
      isChat: parsed.chatMode ?? DefaultPromptConfig.isChat,
    },
  }
}

export const serializeCodeBlock = (code: string): string => stringify({ code })

export const deserializeCodeBlock = (codeBlock: string): string => parse(codeBlock).code
