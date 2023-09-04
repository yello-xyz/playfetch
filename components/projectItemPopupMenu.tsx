import { Chain, Endpoint, Project, Prompt, Workspace } from '@/types'
import api from '@/src/client/api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import { useState } from 'react'
import PickNameDialog from './pickNameDialog'
import MovePromptDialog from './movePromptDialog'
import { useLoggedInUser } from '@/src/client/context/userContext'
import { SharedProjectsWorkspace } from '@/pages'

export default function ProjectItemPopupMenu({
  item,
  workspaces,
  reference,
  isMenuExpanded,
  setMenuExpanded,
  onRefresh,
  onDelete,
}: {
  item: Prompt | Chain
  workspaces: Workspace[]
  reference: Chain | Endpoint | undefined
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
  onRefresh: () => void
  onDelete?: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [showMovePromptDialog, setShowMovePromptDialog] = useState(false)
  const [sharedProjects, setSharedProjects] = useState<Project[]>([])

  const isChain = 'referencedItemIDs' in item

  const deleteCall = () => (isChain ? api.deleteChain(item.id) : api.deletePrompt(item.id))
  const duplicateCall = () => (isChain ? api.duplicateChain(item.id) : api.duplicatePrompt(item.id))
  const renameCall = (name: string) => (isChain ? api.renameChain(item.id, name) : api.renamePrompt(item.id, name))

  const deleteItem = () => {
    setMenuExpanded(false)
    const label = isChain ? 'chain' : 'prompt'
    if (reference) {
      const reason = 'name' in reference ? `it is referenced by chain “${reference.name}”` : `has published endpoints`
      setDialogPrompt({
        title: `Cannot delete ${label} because ${reason}.`,
        confirmTitle: 'OK',
        cancellable: false,
      })
    } else {
      setDialogPrompt({
        title: `Are you sure you want to delete this ${label}? This action cannot be undone.`,
        callback: () => deleteCall().then(onDelete ?? onRefresh),
        destructive: true,
      })
    }
  }

  const renameItem = () => {
    setMenuExpanded(false)
    setShowPickNamePrompt(true)
  }

  const duplicateItem = async () => {
    setMenuExpanded(false)
    duplicateCall().then(onRefresh)
  }

  const copyPromptToProject = () => {
    setMenuExpanded(false)
    api.getSharedProjects().then(setSharedProjects)
    setShowMovePromptDialog(true)
  }

  const user = useLoggedInUser()

  const allWorkspaces = [
    ...workspaces.filter(workspace => workspace.id === user.id),
    ...(sharedProjects.length > 0 ? [SharedProjectsWorkspace(sharedProjects)] : []),
    ...workspaces.filter(workspace => workspace.id !== user.id),
  ]

  return (
    <>
      <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
        <PopupMenuItem title='Rename…' callback={renameItem} first />
        <PopupMenuItem title='Duplicate' callback={duplicateItem} />
        {!isChain && <PopupMenuItem title='Copy to Project…' callback={copyPromptToProject} />}
        <PopupMenuItem separated destructive title='Delete' callback={deleteItem} last />
      </PopupMenu>
      {showPickNamePrompt && (
        <PickNameDialog
          title={isChain ? 'Rename Chain' : 'Rename Prompt'}
          confirmTitle='Rename'
          label='Name'
          initialName={item.name}
          onConfirm={name => renameCall(name).then(onRefresh)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
      {!isChain && showMovePromptDialog && (
        <MovePromptDialog
          item={item}
          workspaces={allWorkspaces}
          onConfirm={projectID => api.duplicatePrompt(item.id, projectID).then(onRefresh)}
          onDismiss={() => setShowMovePromptDialog(false)}
        />
      )}
    </>
  )
}
