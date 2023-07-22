import { Workspace } from '@/types'
import api from '../src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'

export default function WorkspacePopupMenu({
  workspace,
  isMenuExpanded,
  setIsMenuExpanded,
  onRenamed,
  onDeleted,
}: {
  workspace: Workspace
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  onRenamed: () => void
  onDeleted: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const deleteWorkspace = () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: 'Are you sure you want to delete this workspace and ALL its projects? This action cannot be undone.',
      callback: () => api.deleteWorkspace(workspace.id).then(onDeleted),
      destructive: true,
    })
  }

  const renameWorkspace = () => {
    setIsMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  return (
    <>
      <PopupMenu className='w-44' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
        <PopupMenuItem title='Rename Workspace' callback={renameWorkspace} />
        <PopupMenuItem separated destructive title='Delete Workspace' callback={deleteWorkspace} />
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
