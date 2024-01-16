import { PromptConfig } from '@/types'

export type UserPresets = {
  defaultPromptConfig: PromptConfig
  layoutConfig: {
    floatingSidebar: boolean
    splitPromptTabs: boolean
  }
}
