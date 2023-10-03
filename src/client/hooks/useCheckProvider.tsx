import useAvailableProviders from './useAvailableProviders'

export default function useCheckProvider() {
  const availableProviders = useAvailableProviders()
  return (provider: string) => !!availableProviders.find(p => p.provider === provider)
}
