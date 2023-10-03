import { useLoggedInUser } from '../context/userContext'

export default function useProviders() {
  const user = useLoggedInUser()
  const availableProviders = user.availableProviders
  const checkProvider = (provider: string) => !!availableProviders.find(p => p.provider === provider)
  return [availableProviders, checkProvider] as const
}

export function useAvailableProviders() {
  const [availableProviders] = useProviders()
  return availableProviders
}

export function useCheckProvider() {
  const [_, checkProvider] = useProviders()
  return checkProvider
}
