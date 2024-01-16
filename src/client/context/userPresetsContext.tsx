import { createContext, useContext, useState } from 'react'
import { LanguageModel, PromptConfig } from '@/types'
import { LayoutConfig, PromptTab, UserPresets } from '@/src/common/userPresets'
import api from '../api'

type UserPresetsContextType = {
  currentUserPresets?: UserPresets
  setCurrentUserPresets?: (newPresets: UserPresets) => void
}

export const UserPresetsContext = createContext<UserPresetsContextType>({})

export function useDefaultPromptConfig() {
  const context = useContext(UserPresetsContext)

  const currentUserPresets = context.currentUserPresets!
  const initialConfig = currentUserPresets.defaultPromptConfig
  const [currentConfig, setCurrentConfig] = useState(initialConfig)

  const updateConfig = (config: Partial<PromptConfig>) => {
    setCurrentConfig({ ...currentConfig, ...config })
    api
      .updateDefaultPromptConfig(config)
      .then(defaultPromptConfig => context.setCurrentUserPresets!({ ...currentUserPresets, defaultPromptConfig }))
  }

  const updateDefaultModel = (model: LanguageModel) => updateConfig({ model })
  const updateDefaultParameters = (config: Omit<PromptConfig, 'model'>) => updateConfig(config)

  return [currentConfig, updateDefaultModel, updateDefaultParameters] as const
}

function useLayoutConfig() {
  const context = useContext(UserPresetsContext)

  const currentUserPresets = context.currentUserPresets!
  const initialConfig = currentUserPresets.layoutConfig
  const [currentConfig, setCurrentConfig] = useState(initialConfig)

  const updateConfig = (config: Partial<LayoutConfig>) => {
    setCurrentConfig({ ...currentConfig, ...config })
    api
      .updateLayoutConfig(config)
      .then(layoutConfig => context.setCurrentUserPresets!({ ...currentUserPresets, layoutConfig }))
  }

  const floatingSidebar = currentConfig.floatingSidebar
  const setFloatingSidebar = (floatingSidebar: boolean) => updateConfig({ floatingSidebar })
  
  const promptTabs = currentConfig.promptTabs
  const setPromptTabs = (promptTabs: PromptTab[][]) => updateConfig({ promptTabs })

  return [floatingSidebar, promptTabs, setFloatingSidebar, setPromptTabs] as const
}

export function useFloatingSidebar() {
  const [floatingSidebar, _, setFloatingSidebar] = useLayoutConfig()
  return [floatingSidebar, setFloatingSidebar] as const
}

export function usePromptTabs() {
  const [_, promptTabs, __, setPromptTabs] = useLayoutConfig()
  return [promptTabs, setPromptTabs] as const
}
