import {
  AvailableProvider,
  AvailableSourceControlProvider,
  EmbeddingModel,
  IsModelProvider,
  LanguageModel,
  ModelProvider,
  QueryProvider,
  SourceControlProvider,
} from '@/types'
import {
  IsModelAvailable,
  IsModelDisabled,
  IsProviderAvailable,
  SourceControlProviders,
} from '@/src/common/providerMetadata'
import { createContext, useContext } from 'react'

type ProviderContextType = {
  availableProviders?: AvailableProvider[]
}

export const ProviderContext = createContext<ProviderContextType>({})

function useAvailableProviders() {
  const context = useContext(ProviderContext)
  const availableProviders = context.availableProviders ?? []
  return availableProviders ?? []
}

function useProviders() {
  const availableProviders = useAvailableProviders()
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  const checkModelAvailable = (model: LanguageModel | EmbeddingModel) =>
    IsModelAvailable(model, availableModelProviders)
  const checkProviderAvailable = (provider: ModelProvider | QueryProvider) =>
    IsProviderAvailable(provider, availableProviders)
  return [availableProviders, checkModelAvailable, checkProviderAvailable] as const
}

export function useSourceControlProvider() {
  const availableProviders = useAvailableProviders()
  return availableProviders.find(p => (SourceControlProviders as string[]).includes(p.provider)) as
    | AvailableSourceControlProvider
    | undefined
}

export function useModelProviders() {
  const [availableProviders, checkModelAvailable] = useProviders()
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  const checkModelProviderAvailable = (provider: ModelProvider) =>
    IsProviderAvailable(provider, availableModelProviders)
  return [availableModelProviders, checkModelAvailable, checkModelProviderAvailable] as const
}

export default function useAvailableModelProviders() {
  const [availableModelProviders] = useModelProviders()
  return availableModelProviders
}

export function useCheckProviders() {
  const [, checkModelAvailable, checkProviderAvailable] = useProviders()
  return [checkProviderAvailable, checkModelAvailable] as const
}

export function useCheckModelProviders() {
  const [, checkModelAvailable, checkModelProviderAvailable] = useModelProviders()
  return [checkModelProviderAvailable, checkModelAvailable] as const
}

export function useCheckProviderAvailable() {
  const [checkProviderAvailable] = useCheckProviders()
  return checkProviderAvailable
}

export function useCheckModelDisabled() {
  const [availableModelProviders] = useModelProviders()
  return (model: LanguageModel) => IsModelDisabled(model, availableModelProviders)
}
