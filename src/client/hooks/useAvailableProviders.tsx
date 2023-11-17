import { EmbeddingModel, IsModelProvider, LanguageModel, ModelProvider, QueryProvider } from '@/types'
import { useLoggedInUser } from '../context/userContext'
import { IsModelAvailable, IsModelDisabled, IsProviderAvailable } from '@/src/common/providerMetadata'

function useProviders() {
  const user = useLoggedInUser()
  const availableProviders = user.availableProviders
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  const checkModelAvailable = (model: LanguageModel | EmbeddingModel) =>
    IsModelAvailable(model, availableModelProviders)
  const checkProviderAvailable = (provider: ModelProvider | QueryProvider) =>
    IsProviderAvailable(provider, availableProviders)
  return [availableProviders, checkModelAvailable, checkProviderAvailable] as const
}

export function useModelProviders() {
  const [availableProviders, checkModelAvailable] = useProviders()
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  const checkModelProviderAvailable = (provider: ModelProvider) =>
    IsProviderAvailable(provider, availableModelProviders)
  return [availableModelProviders, checkModelAvailable, checkModelProviderAvailable] as const
}

export default function useAvailableProviders() {
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
