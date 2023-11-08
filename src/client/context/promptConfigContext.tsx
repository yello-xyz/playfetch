import { createContext, useContext } from 'react'
import { PromptConfig } from '@/types'
import api from '../api'

type PromptConfigContextType = {
  defaultPromptConfig?: PromptConfig
  setDefaultPromptConfig?: (newConfig: PromptConfig) => void
}

export const PromptConfigContext = createContext<PromptConfigContextType>({})

export function useDefaultPromptConfig() {
  const context = useContext(PromptConfigContext)

  const defaultPromptConfig = context.defaultPromptConfig!

  const updateDefaultPromptConfig = (newConfig: Partial<PromptConfig>) => {
    api.updateDefaultConfig(newConfig)
    context.setDefaultPromptConfig?.({ ...defaultPromptConfig, ...newConfig })
  }

  return [defaultPromptConfig, updateDefaultPromptConfig] as const
}
