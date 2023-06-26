import { createContext, useContext } from 'react'

type RefreshContextType = {
  refreshPage?: () => Promise<void>
  refreshProjects?: () => Promise<void>
  selectProject?: (projectID: number) => Promise<void>
  refreshProject?: () => Promise<void>
  selectPrompt?: (promptID: number) => Promise<void>
  refreshPrompt?: (focusVersionID?: number) => Promise<void>
  savePrompt?: () => Promise<number>
}

export const RefreshContext = createContext<RefreshContextType>({})

export const useRefreshPage = () => useContext(RefreshContext).refreshPage!
export const useRefreshProjects = () => useContext(RefreshContext).refreshProjects!
export const useSelectProject = () => useContext(RefreshContext).selectProject!
export const useRefreshProject = () => useContext(RefreshContext).refreshProject!
export const useSelectPrompt = () => useContext(RefreshContext).selectPrompt!
export const useRefreshPrompt = () => useContext(RefreshContext).refreshPrompt!
export const useSavePrompt = () => useContext(RefreshContext).savePrompt!
