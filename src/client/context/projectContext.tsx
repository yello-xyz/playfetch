import { ActiveProject } from '@/types'
import { createContext, useContext } from 'react'

type ProjectContextType = {
  activeProject?: ActiveProject
  refreshProject?: () => Promise<void>
  refreshActiveItem?: (focusVersionID?: number) => Promise<void>
}

export const ProjectContext = createContext<ProjectContextType>({})

export const useActiveProject = () => useContext(ProjectContext).activeProject!
export const useRefreshProject = () => useContext(ProjectContext).refreshProject!
export const useRefreshActiveItem = () => useContext(ProjectContext).refreshActiveItem!
