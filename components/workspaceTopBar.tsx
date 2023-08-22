import { ActiveWorkspace } from '@/types'
import { TopBarButton, UserAvatars } from './topBarButton'
import addIcon from '@/public/addWhite.svg'
import chevronIcon from '@/public/chevron.svg'
import fileIcon from '@/public/file.svg'
import folderIcon from '@/public/folder_32_black.svg'
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
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const hasPopupMenu = !isUserWorkspace && !isSharedProjects

  return (
    <div className='flex items-center justify-between pt-4 pb-3.5 px-5'>
      <div
        className={`flex items-center gap-1 py-1.5 ${hasPopupMenu ? 'relative cursor-pointer' : ''}`}
        onClick={hasPopupMenu ? () => setMenuExpanded(!isMenuExpanded) : undefined}>
        {hasPopupMenu && <Icon icon={isUserWorkspace ? fileIcon : folderIcon} />}
        <div className='flex items-center gap-0'>
          <span className='text-base font-semibold text-dark-gray-700 leading-6'>{activeWorkspace.name}</span>
          {hasPopupMenu && (
            <>
              <Icon icon={chevronIcon} />
              <div className='absolute left-0 top-8'>
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
          <TopBarButton type='primary' title='New Project' icon={addIcon} onClick={onAddProject} />
        </div>
      )}
    </div>
  )
}
