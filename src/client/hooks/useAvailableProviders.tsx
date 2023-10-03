import { useLoggedInUser } from '../context/userContext'

export default function useAvailableProviders() {
  const user = useLoggedInUser()
  return user.availableProviders
}
