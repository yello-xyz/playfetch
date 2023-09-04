import { useLoggedInUser } from '../context/userContext'

export default function useCheckProvider() {
  const user = useLoggedInUser()

  return (provider: string) => !!user.availableProviders.find(p => p.provider === provider)
}
