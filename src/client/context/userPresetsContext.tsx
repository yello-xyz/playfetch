import { createContext, useContext } from 'react'
import { LanguageModel, PromptConfig } from '@/types'
import api from '../api'

export type UserPresets = {
  defaultPromptConfig: PromptConfig
}

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
      .updateDefaultConfig(config)
      .then(defaultPromptConfig => context.setCurrentUserPresets!({ ...currentUserPresets, defaultPromptConfig }))

  const updateDefaultModel = (model: LanguageModel) => updateConfig({ model })
  const updateDefaultParameters = (config: Omit<PromptConfig, 'model'>) => updateConfig(config)

  return [currentUserPresets.defaultPromptConfig, updateDefaultModel, updateDefaultParameters] as const
}
