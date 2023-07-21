import { createContext, useContext } from 'react'

type RefreshContextType = {
  refreshPrompt?: (focusVersionID?: number) => Promise<void>
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshPrompt = () => useContext(RefreshContext).refreshPrompt!
