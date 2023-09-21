import { ActiveWorkspace } from '@/types'
import { TopBarButton, UserAvatars } from '../topBarButton'
import addIcon from '@/public/addWhite.svg'
import chevronIcon from '@/public/chevron.svg'
import fileIcon from '@/public/file.svg'
import folderIcon from '@/public/folderBig.svg'
import Icon from '../icon'
import { useState } from 'react'
import WorkspacePopupMenu from './workspacePopupMenu'
import spinnerIcon from '@/public/spinner.svg'

export default function WorkspaceTopBar({
  activeWorkspace,
  isUserWorkspace,
  isSharedProjects,
  onAddProject,
  setShowInviteDialog,
  onRenamed,
  onDeleted,
}: {
  activeWorkspace: ActiveWorkspace
  isUserWorkspace: boolean
  isSharedProjects: boolean
  onAddProject: () => Promise<void>
  setShowInviteDialog: (show: boolean) => void
  onRenamed: () => void
  onDeleted: () => void
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const hasPopupMenu = !isUserWorkspace && !isSharedProjects

  return (
    <div className='flex items-center justify-between pt-3 pb-2.5 px-5'>
      <div
        className={`flex items-center gap-1 py-1.5 ${hasPopupMenu ? 'relative cursor-pointer' : ''}`}
        onClick={hasPopupMenu ? () => setMenuExpanded(!isMenuExpanded) : undefined}>
        {hasPopupMenu && <Icon icon={isUserWorkspace ? fileIcon : folderIcon} />}
        <div className='flex items-center gap-0'>
          <span className='text-lg font-medium leading-8 text-gray-700'>{activeWorkspace.name}</span>
          {hasPopupMenu && (
            <>
              <Icon icon={chevronIcon} />
              <div className='absolute shadow-sm -left-1 top-10'>
                <WorkspacePopupMenu
                  workspace={activeWorkspace}
                  isOnlyUser={activeWorkspace.users.length === 1}
                  isMenuExpanded={isMenuExpanded}
                  setMenuExpanded={setMenuExpanded}
                  onRenamed={onRenamed}
                  onDeleted={onDeleted}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {!isSharedProjects && (
        <div className='flex items-center gap-2'>
          <UserAvatars users={activeWorkspace.users} />
          {!isUserWorkspace && <TopBarButton title='Invite' onClick={() => setShowInviteDialog(true)} />}
          <AddProjectButton onAddProject={onAddProject} />
        </div>
      )}
    </div>
  )
}

export function AddProjectButton({ onAddProject }: { onAddProject: () => Promise<void> }) {
  const [isAdding, setAdding] = useState(false)

  const addProject = async () => {
    setAdding(true)
    await onAddProject()
    setAdding(false)
  }

  return (
    <TopBarButton
      disabled={isAdding}
      type='primary'
      title='New Project'
      icon={isAdding ? spinnerIcon : addIcon}
      iconClassName={isAdding ? 'animate-spin max-w-[24px]' : undefined}
      onClick={addProject}
    />
  )
}
