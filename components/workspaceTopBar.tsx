import { ActiveWorkspace } from '@/types'
import { TopBarButton, UserAvatars } from './topBarButton'
import addIcon from '@/public/add.svg'
import chevronIcon from '@/public/chevron.svg'
import fileIcon from '@/public/file.svg'
import projectIcon from '@/public/project.svg'
import Icon from './icon'
import { useState } from 'react'
import WorkspacePopupMenu from './workspacePopupMenu'

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
  onAddProject: () => void
  setShowInviteDialog: (show: boolean) => void
  onRenamed: () => void
  onDeleted: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const hasPopupMenu = !isUserWorkspace && !isSharedProjects

  return (
    <div className='flex items-center justify-between py-4'>
      <div
        className={`flex items-center gap-1 py-1.5 ${hasPopupMenu ? 'relative cursor-pointer' : ''}`}
        onClick={hasPopupMenu ? () => setIsMenuExpanded(!isMenuExpanded) : undefined}>
        <Icon icon={isUserWorkspace ? fileIcon : projectIcon} />
        <span className='text-base font-medium text-gray-800'>{activeWorkspace.name}</span>
        {hasPopupMenu && (
          <>
            <Icon icon={chevronIcon} />
            <div className='absolute left-0 top-8'>
              <WorkspacePopupMenu
                workspace={activeWorkspace}
                isMenuExpanded={isMenuExpanded}
                setIsMenuExpanded={setIsMenuExpanded}
                onRenamed={onRenamed}
                onDeleted={onDeleted}
              />
            </div>
          </>
        )}
      </div>
      {!isSharedProjects && (
        <div className='flex items-center gap-2'>
          <UserAvatars users={activeWorkspace.users} />
          {!isUserWorkspace && <TopBarButton title='Invite' onClick={() => setShowInviteDialog(true)} />}
          <TopBarButton title='New Project' icon={addIcon} onClick={onAddProject} />
        </div>
      )}
    </div>
  )
}
