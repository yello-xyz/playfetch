import { createContext, useContext } from 'react'
import { ActivePromptTab } from './promptTabView'

type RefreshContextType = {
  refreshProjects?: () => Promise<void>
  selectProject?: (projectID: number) => Promise<void>
  resetProject?: () => Promise<void>
  refreshProject?: () => Promise<void>
  selectPrompt?: (promptID: number) => Promise<void>
  refreshPrompt?: (focusVersionID?: number) => Promise<void>
  savePrompt?: () => Promise<number>
  selectTab?: (tab: ActivePromptTab) => void
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshProjects = () => useContext(RefreshContext).refreshProjects!
export const useSelectProject = () => useContext(RefreshContext).selectProject!
export const useResetProject = () => useContext(RefreshContext).resetProject!
export const useRefreshProject = () => useContext(RefreshContext).refreshProject!
export const useSelectPrompt = () => useContext(RefreshContext).selectPrompt!
export const useRefreshPrompt = () => useContext(RefreshContext).refreshPrompt!
export const useSavePrompt = () => useContext(RefreshContext).savePrompt!
export const useSelectTab = () => useContext(RefreshContext).selectTab!
