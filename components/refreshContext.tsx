import { createContext, useContext } from 'react'
import { MainViewTab } from './promptTabView'

type RefreshContextType = {
  refreshProjects?: () => Promise<void>
  resetProject?: () => Promise<void>
  refreshProject?: () => Promise<void>
  refreshPrompt?: (focusVersionID?: number) => Promise<void>
  selectTab?: (tab: MainViewTab) => void
  refreshSettings?: () => Promise<void>
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshProjects = () => useContext(RefreshContext).refreshProjects!
export const useResetProject = () => useContext(RefreshContext).resetProject!
export const useRefreshProject = () => useContext(RefreshContext).refreshProject!
export const useRefreshPrompt = () => useContext(RefreshContext).refreshPrompt!
export const useSelectTab = () => useContext(RefreshContext).selectTab!
export const useRefreshSettings = () => useContext(RefreshContext).refreshSettings!
