import { useState } from 'react'
import ModalDialog from './modalDialog'
import { ActiveWorkspace, Project, Prompt, Workspace } from '@/types'
import DropdownMenu from './dropdownMenu'
import api from '@/src/client/api'

export default function MovePromptDialog({
  item,
  workspaces,
  onConfirm,
  onDismiss,
}: {
  item: Prompt
  workspaces: (Workspace | ActiveWorkspace)[]
  onConfirm: (projectID: number) => void
  onDismiss: () => void
}) {
  const NoWorkspaceID = 0
  const NoProjectID = 0

  const [workspaceID, setWorkspaceID] = useState(NoWorkspaceID)
  const [loadedProjects, setLoadedProjects] = useState<Record<number, Project[]>>({})
  const [projectID, setProjectID] = useState(item.projectID)

  const updateWorkspaceID = (workspaceID: number) => {
    setWorkspaceID(workspaceID)
    if (!loadedProjects[workspaceID]) {
      const workspace = workspaces.find(workspace => workspace.id === workspaceID)
      if (workspace && 'projects' in workspace) {
        setLoadedProjects({ ...loadedProjects, [workspaceID]: workspace.projects })
      } else {
        api.getWorkspace(workspaceID).then(loadedWorkspace => {
          setLoadedProjects({ ...loadedProjects, [workspaceID]: loadedWorkspace.projects })
          setProjectID(loadedWorkspace.projects[0]?.id ?? NoProjectID)
        })
      }
    }
  }

  if (workspaceID === NoWorkspaceID) {
    updateWorkspaceID(workspaces[0].id)
  }

  const projects = loadedProjects[workspaceID] ?? []
  if (projectID && !projects.some(project => project.id === projectID)) {
    setProjectID(projects[0]?.id ?? NoProjectID)
  }

  const dialogPrompt = {
    title: `Copy “${item.name}”`,
    confirmTitle: 'Copy',
    callback: () => onConfirm(projectID),
    disabled: projectID === NoProjectID,
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <div className='flex flex-col gap-2'>
        <DropdownMenu value={workspaceID} onChange={value => updateWorkspaceID(Number(value))}>
          {workspaces.map(workspace => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </DropdownMenu>
        <DropdownMenu value={projectID} onChange={value => setProjectID(Number(value))}>
          {projects.map((project, index) => (
            <option key={index} value={project.id}>
              {project.name}
            </option>
          ))}
          {!projects.length && (
            <option value={NoProjectID} disabled>
              {loadedProjects[workspaceID] ? 'No projects in workspace' : 'Loading projects…'}
            </option>
          )}
        </DropdownMenu>
      </div>
    </ModalDialog>
  )
}
