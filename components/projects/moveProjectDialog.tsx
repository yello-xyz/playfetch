import { useState } from 'react'
import ModalDialog from '../modalDialog'
import { Project, Workspace } from '@/types'
import DropdownMenu from '../dropdownMenu'
import api from '@/src/client/api'

export default function MoveProjectDialog({
  workspaces,
  project,
  onRefresh,
  onDismiss,
}: {
  workspaces: Workspace[]
  project: Project
  onRefresh: () => void
  onDismiss: () => void
}) {
  const [workspaceID, setWorkspaceID] = useState(project.workspaceID)

  const dialogPrompt = {
    title: `Move “${project.name}”`,
    confirmTitle: 'Move',
    callback: () => api.moveProject(project.id, workspaceID).then(onRefresh),
    disabled: workspaceID === project.workspaceID,
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <DropdownMenu className='w-full' value={workspaceID} onChange={value => setWorkspaceID(Number(value))}>
        {workspaces.map((workspace, index) => (
          <option key={index} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </DropdownMenu>
    </ModalDialog>
  )
}
