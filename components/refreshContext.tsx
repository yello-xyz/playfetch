import { createContext, useContext } from 'react'

type RefreshContextType = {
  refreshPrompt?: (focusVersionID?: number) => Promise<void>
  refreshSettings?: () => Promise<void>
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshPrompt = () => useContext(RefreshContext).refreshPrompt!
export const useRefreshSettings = () => useContext(RefreshContext).refreshSettings!
