import { createContext, useContext } from 'react'
import { ActivePromptTab } from './promptTabView'

type RefreshContextType = {
  refreshPage?: () => Promise<void>
  refreshProjects?: () => Promise<void>
  selectProject?: (projectID: number) => Promise<void>
  selectUserProject?: () => Promise<void>
  refreshProject?: () => Promise<void>
  selectPrompt?: (promptID: number) => Promise<void>
  refreshPrompt?: (focusVersionID?: number) => Promise<void>
  savePrompt?: () => Promise<number>
  selectTab?: (tab: ActivePromptTab) => void
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshPage = () => useContext(RefreshContext).refreshPage!
export const useRefreshProjects = () => useContext(RefreshContext).refreshProjects!
export const useSelectProject = () => useContext(RefreshContext).selectProject!
export const useSelectUserProject = () => useContext(RefreshContext).selectUserProject!
export const useRefreshProject = () => useContext(RefreshContext).refreshProject!
export const useSelectPrompt = () => useContext(RefreshContext).selectPrompt!
export const useRefreshPrompt = () => useContext(RefreshContext).refreshPrompt!
export const useSavePrompt = () => useContext(RefreshContext).savePrompt!
export const useSelectTab = () => useContext(RefreshContext).selectTab!
