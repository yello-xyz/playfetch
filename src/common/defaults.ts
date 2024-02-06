import { PromptConfig, ModelProvider } from '@/types'
import { LayoutConfig } from './userPresets'

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

export const NeedsUpdatesLabel = 'Needs updates'
export const DefaultLabels = ['Experiment', 'Integration ready', 'QA ready', NeedsUpdatesLabel, 'Production ready']
