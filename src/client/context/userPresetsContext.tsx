import { createContext, useContext } from 'react'
import { LanguageModel, PromptConfig } from '@/types'
import { UserPresets } from '@/src/common/userPresets'
import api from '../api'

type UserPresetsContextType = {
  currentUserPresets?: UserPresets
  setCurrentUserPresets?: (newPresets: UserPresets) => void
}

export const UserPresetsContext = createContext<UserPresetsContextType>({})

export function useDefaultPromptConfig() {
  const context = useContext(UserPresetsContext)

  const currentUserPresets = context.currentUserPresets!

  const updateConfig = (config: Partial<PromptConfig>) =>
    api
      .updateDefaultPromptConfig(config)
      .then(defaultPromptConfig => context.setCurrentUserPresets!({ ...currentUserPresets, defaultPromptConfig }))

  const updateDefaultModel = (model: LanguageModel) => updateConfig({ model })
  const updateDefaultParameters = (config: Omit<PromptConfig, 'model'>) => updateConfig(config)

  return [currentUserPresets.defaultPromptConfig, updateDefaultModel, updateDefaultParameters] as const
}

function useLayoutConfig() {
  const context = useContext(UserPresetsContext)

  const currentUserPresets = context.currentUserPresets!

  const updateConfig = (config: Partial<UserPresets['layoutConfig']>) =>
    api
      .updateLayoutConfig(config)
      .then(layoutConfig => context.setCurrentUserPresets!({ ...currentUserPresets, layoutConfig }))

  const floatingSidebar = currentUserPresets.layoutConfig.floatingSidebar
  const setFloatingSidebar = (floatingSidebar: boolean) => updateConfig({ floatingSidebar })
  
  const splitPromptTabs = currentUserPresets.layoutConfig.splitPromptTabs
  const setSplitPromptTabs = (splitPromptTabs: boolean) => updateConfig({ splitPromptTabs })

  return [floatingSidebar, splitPromptTabs, setFloatingSidebar, setSplitPromptTabs] as const
}

export function useFloatingSidebar() {
  const [floatingSidebar, _, setFloatingSidebar] = useLayoutConfig()
  return [floatingSidebar, setFloatingSidebar] as const
}

export function useSplitPromptTabs() {
  const [_, splitPromptTabs, __, setSplitPromptTabs] = useLayoutConfig()
  return [splitPromptTabs, setSplitPromptTabs] as const
}
