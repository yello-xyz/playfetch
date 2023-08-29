import { ModelProvider } from '@/types'
import { useLoggedInUser } from '../context/userContext'
import { useRouter } from 'next/router'
import ClientRoute from '../clientRoute'

export default function useCheckProvider() {
  const router = useRouter()
  const user = useLoggedInUser()

  return (provider: ModelProvider) => {
    if (user.availableProviders.find(p => p.provider === provider)) {
      return true
    } else {
      router.push(ClientRoute.Settings)
      return false
    }
  }
}
