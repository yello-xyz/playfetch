import { ActiveWorkspace } from '@/types'
import { TopBarButton, UserAvatars } from './topBarButton'
import addIcon from '@/public/add.svg'

export default function WorkspaceTopBar({
  activeWorkspace,
  isUserWorkspace,
  isSharedProjects,
  onAddProject,
  setShowInviteDialog,
}: {
  activeWorkspace: ActiveWorkspace
  isUserWorkspace: boolean
  isSharedProjects: boolean
  onAddProject: () => void
  setShowInviteDialog: (show: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between py-4'>
      <span className='text-base font-medium text-gray-800'>{activeWorkspace.name}</span>
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
