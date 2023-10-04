import { IsModelProvider, LanguageModel, ModelProvider, QueryProvider } from '@/types'
import { useLoggedInUser } from '../context/userContext'
import { IsModelAvailable, IsModelDisabled, IsProviderAvailable } from '@/src/common/providerMetadata'

function useProviders() {
  const user = useLoggedInUser()
  const availableProviders = user.availableProviders
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  const checkModelAvailable = (model: LanguageModel) => IsModelAvailable(model, availableModelProviders)
  const checkProviderAvailable = (provider: ModelProvider | QueryProvider) =>
    IsProviderAvailable(provider, availableProviders)
  return [availableProviders, checkModelAvailable, checkProviderAvailable] as const
}

export default function useModelProviders() {
  const [availableProviders, checkModelAvailable] = useProviders()
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  const checkModelProviderAvailable = (provider: ModelProvider) =>
    IsProviderAvailable(provider, availableModelProviders)
  return [availableModelProviders, checkModelAvailable, checkModelProviderAvailable] as const
}

export function useCheckProviders() {
  const [_, checkModelAvailable, checkProviderAvailable] = useProviders()
  return [checkProviderAvailable, checkModelAvailable] as const
}

export function useAvailableProviders() {
  const [availableModelProviders] = useModelProviders()
  return availableModelProviders
}

export function useCheckModelProviderAvailable() {
  const [availableModelProviders] = useModelProviders()
  return (provider: ModelProvider) => IsProviderAvailable(provider, availableModelProviders)
}

export function useCheckModelDisabled() {
  const [availableModelProviders] = useModelProviders()
  return (model: LanguageModel) => IsModelDisabled(model, availableModelProviders)
}
