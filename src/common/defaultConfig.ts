import { PromptConfig, ModelProvider } from '@/types'
import { LayoutConfig, UserPresets } from './userPresets'

export const DefaultProvider: ModelProvider = 'google'

const DefaultModel = 'text-bison'

export const DefaultPrompts = { main: '' }

export const DefaultPromptConfig: PromptConfig = {
  model: DefaultModel,
  isChat: false,
  temperature: 0.5,
  maxTokens: 1000,
}

export const DefaultLayoutConfig: LayoutConfig = {
  floatingSidebar: false,
  promptTabs: [['New Prompt', 'Version History']],
}
