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

  const updateDefaultModel = (model: LanguageModel) => {
    api.updateDefaultConfig({ model })
    context.setDefaultPromptConfig?.({ ...defaultPromptConfig, model })
  }

  const updateDefaultParameters = (config: Omit<PromptConfig, 'model'>) => {
    api.updateDefaultConfig(config)
    context.setDefaultPromptConfig?.({ model: defaultPromptConfig.model, ...config })
  }

  return [defaultPromptConfig, updateDefaultModel, updateDefaultParameters] as const
}
