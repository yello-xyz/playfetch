import { Workspace } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'

export default function WorkspacePopupMenu({
  workspace,
  isOnlyUser,
  isMenuExpanded,
  setMenuExpanded,
  onRenamed,
  onDeleted,
}: {
  workspace: Workspace
  isOnlyUser: boolean
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
  onRenamed: () => void
  onDeleted: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const deleteWorkspace = () => {
    setMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this workspace and ALL its projects? This action cannot be undone.',
      callback: () => api.deleteWorkspace(workspace.id).then(onDeleted),
      destructive: true,
    })
  }

  const leaveWorkspace = () => {
    setMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to leave this workspace?',
      callback: () => api.leaveWorkspace(workspace.id).then(onDeleted),
      destructive: true,
    })
  }

  const renameWorkspace = () => {
    setMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  return (
    <>
      <PopupMenu className='w-44' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
        <PopupMenuItem title='Rename Workspace' callback={renameWorkspace} />
        {!isOnlyUser && <PopupMenuItem separated destructive title='Leave Workspace' callback={leaveWorkspace} />}
        {isOnlyUser && <PopupMenuItem separated destructive title='Delete Workspace' callback={deleteWorkspace} />}
      </PopupMenu>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Rename Workspace'
          confirmTitle='Rename'
          label='Name'
          initialName={workspace.name}
          onConfirm={name => api.renameWorkspace(workspace.id, name).then(onRenamed)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
