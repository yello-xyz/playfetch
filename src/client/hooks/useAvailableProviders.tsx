import { LanguageModel } from '@/types'
import { useLoggedInUser } from '../context/userContext'
import { IsModelAvailable } from '@/src/common/providerMetadata'

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
