import { createContext, useContext } from 'react'
import { User } from '@/types'

type UserContextType = {
  loggedInUser?: User
}

export const UserContext = createContext<UserContextType>({})

export const useLoggedInUser = () => useContext(UserContext).loggedInUser!
