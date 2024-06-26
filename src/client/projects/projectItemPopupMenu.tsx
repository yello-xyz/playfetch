import { Chain, Endpoint, Project, ProjectItemIsChain, ProjectItemIsPrompt, Prompt, Table, Workspace } from '@/types'
import api from '@/src/client/api'
import PopupMenu, { PopupMenuItem } from '@/src/client/components/popupMenu'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import { useState } from 'react'
import PickNameDialog from '@/src/client/components/pickNameDialog'
import PickProjectDialog from './pickProjectDialog'
import { useLoggedInUser } from '@/src/client/users/userContext'
import { SharedProjectsWorkspace } from '@/pages'
import useProjectItemActions from '@/src/client/projects/useProjectItemActions'

export default function ProjectItemPopupMenu({
  item,
  workspaces,
  reference,
  isMenuExpanded,
  setMenuExpanded,
  onDelete,
}: {
  item: Prompt | Chain | Table
  workspaces: Workspace[]
  reference: Prompt | Chain | Endpoint | undefined
  isMenuExpanded: boolean
  setMenuExpanded: (isExpanded: boolean) => void
  onDelete: () => void
}) {
  const setDialogPrompt = useModalDialogPrompt()

  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [showMovePromptDialog, setShowMovePromptDialog] = useState(false)
  const [sharedProjects, setSharedProjects] = useState<Project[]>([])

  const isChain = ProjectItemIsChain(item)
  const isPrompt = ProjectItemIsPrompt(item)
  const isTable = !isChain && !isPrompt
  const [renameItem, duplicateItem, deleteItem, copyItemToProject] = useProjectItemActions(onDelete)

  const withDismiss = (callback: () => void) => () => {
    setMenuExpanded(false)
    callback()
  }

  const promptDeleteItem = () => {
    const label = isTable ? 'table' : isChain ? 'chain' : 'prompt'
    if (reference) {
      const referenced = isTable ? 'used' : 'referenced'
      const reason =
        'name' in reference ? `it is ${referenced} by chain “${reference.name}”` : `has published endpoints`
      setDialogPrompt({
        title: `Cannot delete ${label} because ${reason}.`,
        confirmTitle: 'OK',
        cancellable: false,
      })
    } else {
      setDialogPrompt({
        title: `Are you sure you want to delete this ${label}? This action cannot be undone.`,
        callback: () => deleteItem(item),
        destructive: true,
      })
    }
  }

  const copyPromptToProject = () => {
    api.getSharedProjects().then(([projects]) => setSharedProjects(projects))
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
        <PopupMenuItem title='Rename…' callback={withDismiss(() => setShowPickNamePrompt(true))} first />
        {!isTable && <PopupMenuItem title='Duplicate' callback={withDismiss(() => duplicateItem(item))} />}
        {isPrompt && <PopupMenuItem title='Copy to Project…' callback={withDismiss(copyPromptToProject)} />}
        <PopupMenuItem separated destructive title='Delete' callback={withDismiss(promptDeleteItem)} last />
      </PopupMenu>
      {showPickNamePrompt && (
        <PickNameDialog
          title={isChain ? 'Rename Chain' : 'Rename Prompt'}
          confirmTitle='Rename'
          label='Name'
          initialName={item.name}
          onConfirm={name => renameItem(item, name)}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
      {isPrompt && showMovePromptDialog && (
        <PickProjectDialog
          initialProjectID={item.projectID}
          title={`Copy “${item.name}”`}
          confirmTitle='Copy'
          workspaces={allWorkspaces}
          onConfirm={projectID => copyItemToProject(item, projectID)}
          onDismiss={() => setShowMovePromptDialog(false)}
        />
      )}
    </>
  )
}
