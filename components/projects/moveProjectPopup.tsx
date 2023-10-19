import { useState } from 'react'
import ModalDialog from '../modalDialog'
import { Project, Workspace } from '@/types'
import DropdownMenu from '../dropdownMenu'
import api from '@/src/client/api'
import { PopupContent, PopupLabelItem, PopupSectionDivider, PopupSectionTitle } from '../popupMenu'
import addIcon from '@/public/add.svg'
import folderIcon from '@/public/folder.svg'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { useLoggedInUser } from '@/src/client/context/userContext'

function MoveProjectDialog({
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

export type MoveProjectPopupProps = {
  workspaces: Workspace[]
  project: Project
  selectWorkspace: (id: number) => void
}

export default function MoveProjectPopup({
  workspaces,
  project,
  selectWorkspace,
  withDismiss,
}: MoveProjectPopupProps & WithDismiss) {
  const user = useLoggedInUser()
  const userWorkspace = workspaces.find(workspace => workspace.id === user.id)

  return (
    <PopupContent className='p-3 min-w-[340px]'>
      <h3 className='p-1 pb-2 text-base font-semibold'>Move “{project.name}”</h3>
      {userWorkspace && (
        <PopupLabelItem
          label={userWorkspace.name}
          icon={folderIcon}
          onClick={withDismiss(() => selectWorkspace(userWorkspace.id))}
          checked={project.workspaceID === userWorkspace.id}
        />
      )}
      <PopupSectionTitle>Workspaces</PopupSectionTitle>
      {workspaces
        .filter(workspace => workspace.id !== user.id)
        .map((workspace, index) => (
          <PopupLabelItem
            key={index}
            label={workspace.name}
            icon={folderIcon}
            onClick={withDismiss(() => selectWorkspace(workspace.id))}
            checked={project.workspaceID === workspace.id}
          />
        ))}
    </PopupContent>
  )
}
