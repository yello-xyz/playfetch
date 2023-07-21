import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Project, Workspace } from '@/types'
import DropdownMenu from './dropdownMenu'

export default function MoveProjectDialog({
  workspaces,
  project,
  onConfirm,
  onDismiss,
}: {
  workspaces: Workspace[]
  project: Project
  onConfirm: (workspaceID: number) => void
  onDismiss: () => void
}) {
  const [workspaceID, setWorkspaceID] = useState(project.workspaceID)

  const dialogPrompt = {
    title: `Move “${project.name}”`,
    confirmTitle: 'Move',
    callback: () => onConfirm(workspaceID),
    disabled: workspaceID === project.workspaceID,
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <DropdownMenu value={workspaceID.toString()} onChange={value => setWorkspaceID(Number(value))}>
        {workspaces.map((workspace, index) => (
          <option key={index} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </DropdownMenu>
    </ModalDialog>
  )
}
