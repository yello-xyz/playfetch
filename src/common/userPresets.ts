import { PromptConfig } from '@/types'

export type PromptTab = 'New Prompt' | 'Version History'
export type LayoutConfig = {
  floatingSidebar: boolean
  promptTabs: PromptTab[][]
}

export type UserPresets = {
  defaultPromptConfig: PromptConfig
  layoutConfig: LayoutConfig
}
