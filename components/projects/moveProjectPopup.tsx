import { useCallback, useState } from 'react'
import { Project, Workspace } from '@/types'
import { PopupContent, PopupLabelItem, PopupSectionDivider, PopupSectionTitle } from '../popupMenu'
import addIcon from '@/public/add.svg'
import folderIcon from '@/public/folder.svg'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { useLoggedInUser } from '@/src/client/context/userContext'
import TextInput from '../textInput'
import Button from '../button'

export type MoveProjectPopupProps = {
  workspaces: Workspace[]
  project: Project
  moveToWorkspace: (id: number) => void
  addNewWorkspace: (name: string) => Promise<number>
}

export default function MoveProjectPopup({
  workspaces,
  project,
  moveToWorkspace,
  addNewWorkspace,
  withDismiss,
}: MoveProjectPopupProps & WithDismiss) {
  const user = useLoggedInUser()
  const userWorkspace = workspaces.find(workspace => workspace.id === user.id)

  const [newWorkspaceName, setNewWorkspaceName] = useState<string>()
  const [addedWorkspaces, setAddedWorkspaces] = useState<{ id: number; name: string }[]>([])
  const isAddingNewWorkspace = newWorkspaceName !== undefined

  const addWorkspace = () =>
    addNewWorkspace(newWorkspaceName!).then(workspaceID => {
      setAddedWorkspaces([...addedWorkspaces, { id: workspaceID, name: newWorkspaceName! }])
      setNewWorkspaceName(undefined)
    })

  const onLoadTextInput = useCallback((node: HTMLInputElement | null) => node?.focus(), [])
  const properWorkspaces = [...workspaces, ...addedWorkspaces].filter(workspace => workspace.id !== user.id)

  return (
    <PopupContent className='p-4 min-w-[340px]'>
      <h3 className='p-1 pb-2 text-base font-semibold'>
        {isAddingNewWorkspace ? 'Create new Workspace' : `Move “${project.name}”`}
      </h3>
      {isAddingNewWorkspace ? (
        <>
          <TextInput
            placeholder='Workspace name'
            onLoad={onLoadTextInput}
            value={newWorkspaceName}
            setValue={setNewWorkspaceName}
          />
          <div className='flex justify-end gap-4 pt-4'>
            <Button type='secondary' onClick={() => setNewWorkspaceName(undefined)}>
              Cancel
            </Button>
            <Button type='primary' disabled={newWorkspaceName.length === 0} onClick={addWorkspace}>
              Create Workspace
            </Button>
          </div>
        </>
      ) : (
        <>
          {userWorkspace && (
            <PopupLabelItem
              title={userWorkspace.name}
              icon={folderIcon}
              onClick={withDismiss(() => moveToWorkspace(userWorkspace.id))}
              checked={project.workspaceID === userWorkspace.id}
            />
          )}
          {properWorkspaces.length > 0 && <PopupSectionTitle>Workspaces</PopupSectionTitle>}
          {properWorkspaces.map((workspace, index) => (
            <PopupLabelItem
              key={index}
              title={workspace.name}
              icon={folderIcon}
              onClick={withDismiss(() => moveToWorkspace(workspace.id))}
              checked={project.workspaceID === workspace.id}
            />
          ))}
          <PopupSectionDivider />
          <PopupLabelItem title='Add new Workspace' icon={addIcon} onClick={() => setNewWorkspaceName('')} />{' '}
        </>
      )}
    </PopupContent>
  )
}
