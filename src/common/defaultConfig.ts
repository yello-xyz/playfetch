import { PromptConfig, ModelProvider } from '@/types'

export const DefaultProvider: ModelProvider = 'google'

const DefaultModel = 'text-bison@001'

export const DefaultConfig: PromptConfig = {
  model: DefaultModel,
  isChat: false,
  temperature: 0.5,
  maxTokens: 250,
}
