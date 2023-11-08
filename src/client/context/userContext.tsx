import { createContext, useContext } from 'react'
import { AvailableProvider, PromptConfig, User } from '@/types'

type UserContextType = {
  loggedInUser?: User
  availableProviders?: AvailableProvider[]
  defaultPromptConfig?: PromptConfig
}

export const UserContext = createContext<UserContextType>({})

export const useLoggedInUser = () => {
  const context = useContext(UserContext)
  return {
    ...context.loggedInUser!,
    availableProviders: context.availableProviders!,
    defaultPromptConfig: context.defaultPromptConfig!,
  }
}

export function useDefaultPromptConfig() {
  const user = useLoggedInUser()
  return user.defaultPromptConfig
}
