import { createContext, useContext } from 'react'
import { AvailableProvider, User } from '@/types'

type UserContextType = {
  loggedInUser?: User
  availableProviders?: AvailableProvider[]
}

export const UserContext = createContext<UserContextType>({})

export const useLoggedInUser = () => {
  const context = useContext(UserContext)
  return { ...context.loggedInUser!, availableProviders: context.availableProviders! }
}
