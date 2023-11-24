import { createContext, useContext } from 'react'

type ProjectContextType = {
  refreshActiveItem?: (focusVersionID?: number) => Promise<void>
  refreshProject?: () => Promise<void>
}

export const ProjectContext = createContext<ProjectContextType>({})

export const useRefreshActiveItem = () => useContext(ProjectContext).refreshActiveItem!
export const useRefreshProject = () => useContext(ProjectContext).refreshProject!
