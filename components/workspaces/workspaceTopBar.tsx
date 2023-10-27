import { ActiveWorkspace, IsPendingWorkspace, PendingWorkspace } from '@/types'
import { TopBarButton } from '../topBarButton'
import { UserAvatars } from '@/components/users/userAvatars'
import addIcon from '@/public/addWhite.svg'
import chevronIcon from '@/public/chevron.svg'
import fileIcon from '@/public/file.svg'
import folderIcon from '@/public/folderBig.svg'
import Icon from '../icon'
import { useState } from 'react'
import WorkspacePopupMenu from './workspacePopupMenu'
import spinnerIcon from '@/public/spinner.svg'
import InviteButton from '../users/inviteButton'

export default function WorkspaceTopBar({
  activeWorkspace,
  isUserWorkspace,
  isSharedProjects,
  onAddProject,
  onInviteMembers,
  onRenamed,
  onDeleted,
}: {
  activeWorkspace: ActiveWorkspace | PendingWorkspace
  isUserWorkspace?: boolean
  isSharedProjects?: boolean
  onAddProject?: () => Promise<void>
  onInviteMembers?: (emails: string[]) => void
  onRenamed?: () => void
  onDeleted?: () => void
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const hasIcon = !isUserWorkspace && !isSharedProjects
  const hasPopupMenu = hasIcon && !IsPendingWorkspace(activeWorkspace)

  return (
    <div className='flex items-center justify-between pt-3 pb-2.5 px-5'>
      <div
        className={`flex items-center gap-1 py-1.5 ${hasPopupMenu ? 'relative cursor-pointer' : ''}`}
        onClick={hasPopupMenu ? () => setMenuExpanded(!isMenuExpanded) : undefined}>
        {hasIcon && <Icon icon={isUserWorkspace ? fileIcon : folderIcon} />}
        <div className='flex items-center gap-0'>
          <span className='text-lg font-medium leading-8 text-gray-700'>{activeWorkspace.name}</span>
          {hasPopupMenu && onRenamed && onDeleted && (
            <>
              <Icon icon={chevronIcon} />
              <div className='absolute shadow-sm -left-1 top-10'>
                <WorkspacePopupMenu
                  workspace={activeWorkspace}
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
      {!isSharedProjects && !IsPendingWorkspace(activeWorkspace) && (
        <div className='flex items-center gap-2'>
          <UserAvatars users={activeWorkspace.users} />
          {!isUserWorkspace && onInviteMembers && (
            <InviteButton
              users={activeWorkspace.users}
              pendingUsers={activeWorkspace.pendingUsers}
              onInvite={onInviteMembers}
            />
          )}
          {onAddProject && <AddProjectButton onAddProject={onAddProject} />}
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
