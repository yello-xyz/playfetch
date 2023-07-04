import { createContext, useContext } from 'react'
import { MainViewTab } from './promptTabView'

type RefreshContextType = {
  refreshProjects?: () => Promise<void>
  resetProject?: () => Promise<void>
  refreshProject?: () => Promise<void>
  refreshPrompt?: (focusVersionID?: number) => Promise<void>
  savePrompt?: () => Promise<number>
  selectTab?: (tab: MainViewTab) => void
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshProjects = () => useContext(RefreshContext).refreshProjects!
export const useResetProject = () => useContext(RefreshContext).resetProject!
export const useRefreshProject = () => useContext(RefreshContext).refreshProject!
export const useRefreshPrompt = () => useContext(RefreshContext).refreshPrompt!
export const useSavePrompt = () => useContext(RefreshContext).savePrompt!
export const useSelectTab = () => useContext(RefreshContext).selectTab!
