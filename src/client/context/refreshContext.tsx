import { createContext, useContext } from 'react'

type RefreshContextType = {
  refreshActiveItem?: (focusVersionID?: number) => Promise<void>
  refreshProject?: () => Promise<void>
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshActiveItem = () => useContext(RefreshContext).refreshActiveItem!
export const useRefreshProject = () => useContext(RefreshContext).refreshProject!
