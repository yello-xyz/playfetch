import { LanguageModel, ModelProvider } from '@/types'
import { useLoggedInUser } from '../context/userContext'
import { IsModelAvailable, IsModelDisabled, IsProviderAvailable } from '@/src/common/providerMetadata'

export default function useProviders() {
  const user = useLoggedInUser()
  const availableProviders = user.availableProviders
  const checkModelAvailable = (model: LanguageModel) => IsModelAvailable(model, availableProviders)
  return [availableProviders, checkModelAvailable] as const
}

export function useAvailableProviders() {
  const [availableProviders] = useProviders()
  return availableProviders
}

export function useCheckModelAvailable() {
  const [_, checkModelAvailable] = useProviders()
  return checkModelAvailable
}

export function useCheckProviderAvailable() {
  const [availableProviders] = useProviders()
  return (provider: ModelProvider) => IsProviderAvailable(provider, availableProviders)
}

export function useCheckModelDisabled() {
  const [availableProviders] = useProviders()
  return (model: LanguageModel) => IsModelDisabled(model, availableProviders)
}
