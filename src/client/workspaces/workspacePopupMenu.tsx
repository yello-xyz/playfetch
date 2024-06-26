import { ActiveWorkspace } from '@/types'
import PopupMenu, { PopupMenuItem } from '@/src/client/components/popupMenu'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import { useState } from 'react'
import PickNameDialog from '@/src/client/components/pickNameDialog'
import useWorkspaceActions from '@/src/client/workspaces/useWorkspaceActions'

export default function WorkspacePopupMenu({
  workspace,
  isMenuExpanded,
  setMenuExpanded,
  onRenamed,
  onShowSettings,
  onDeleted,
}: {
  workspace: ActiveWorkspace
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
  onRenamed: () => void
  onShowSettings: () => void
  onDeleted: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [renameWorkspace, deleteWorkspace, leaveWorkspace] = useWorkspaceActions(onRenamed, onDeleted)

  const withDismiss = (callback: () => void) => () => {
    setMenuExpanded(false)
    callback()
  }

  const promptDelete = () => {
    setDialogPrompt({
      title: 'Are you sure you want to delete this workspace and ALL its projects? This action cannot be undone.',
      callback: () => deleteWorkspace(workspace),
      destructive: true,
    })
  }

  const promptLeave = () => {
    setDialogPrompt({
      title: `Are you sure you want to leave “${workspace.name}”?`,
      content: 'If you leave this workspace, you will no longer have access to any of its projects.',
      confirmTitle: 'Leave Workspace',
      callback: () => leaveWorkspace(workspace),
      destructive: true,
    })
  }

  const isOwner = workspace.owners.length > 0
  const canLeave = !isOwner || workspace.owners.length > 1

  return (
    <>
      <PopupMenu className='w-48' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
        <PopupMenuItem title='Rename Workspace…' callback={withDismiss(() => setShowPickNamePrompt(true))} first />
        {isOwner && <PopupMenuItem title='Settings' callback={withDismiss(onShowSettings)} />}
        {canLeave && (
          <PopupMenuItem
            separated
            destructive
            title='Leave Workspace'
            callback={withDismiss(promptLeave)}
            last={!isOwner}
          />
        )}
        {isOwner && (
          <PopupMenuItem
            separated={!canLeave}
            destructive
            title='Delete Workspace'
            callback={withDismiss(promptDelete)}
            last
          />
        )}
      </PopupMenu>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Rename Workspace'
          confirmTitle='Rename'
          label='Name'
          initialName={workspace.name}
          onConfirm={name => renameWorkspace(workspace, name)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
