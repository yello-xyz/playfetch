import { createContext, useContext } from 'react'

type RefreshContextType = {
  refreshActiveItem?: (focusVersionID?: number) => Promise<void>
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshActiveItem = () => useContext(RefreshContext).refreshActiveItem!
