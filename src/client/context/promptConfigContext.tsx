import { createContext, useContext } from 'react'
import { LanguageModel, PromptConfig } from '@/types'
import api from '../api'

type PromptConfigContextType = {
  defaultPromptConfig?: PromptConfig
  setDefaultPromptConfig?: (newConfig: PromptConfig) => void
}

export const PromptConfigContext = createContext<PromptConfigContextType>({})

export function useDefaultPromptConfig() {
  const context = useContext(PromptConfigContext)

  const defaultPromptConfig = context.defaultPromptConfig!

  const updateConfig = (config: Partial<PromptConfig>) =>
    api.updateDefaultConfig(config).then(context.setDefaultPromptConfig)

  const updateDefaultModel = (model: LanguageModel) => updateConfig({ model })
  const updateDefaultParameters = (config: Omit<PromptConfig, 'model'>) => updateConfig(config)

  return [defaultPromptConfig, updateDefaultModel, updateDefaultParameters] as const
}
