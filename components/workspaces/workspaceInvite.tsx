import { PendingWorkspace } from '@/types'
import WorkspaceTopBar from './workspaceTopBar'
import { FormatRelativeDate } from '@/src/common/formatting'
import Button from '../button'
import UserAvatar from '../users/userAvatar'

export default function WorkspaceInvite({ workspace }: { workspace: PendingWorkspace }) {
  return (
    <div className='flex flex-col h-full'>
      <WorkspaceTopBar activeWorkspace={workspace} />
      <div className='p-6'>
        <div className='flex items-center justify-between w-full gap-6 px-4 py-3 border border-gray-200 rounded-lg select-none bg-gray-25'>
          <div className='flex flex-col gap-2'>
            <span className='flex-1 text-base font-medium text-gray-700 line-clamp-2'>{workspace.name}</span>
            <div className='flex items-center gap-2 text-sm'>
              <UserAvatar size='md' user={workspace.invitedBy} />
              <span className='text-gray-700'>{workspace.invitedBy.fullName} invited you</span>
              <span className='-ml-1 text-gray-400'>• {FormatRelativeDate(workspace.timestamp)}</span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button type='outline' onClick={() => {}}>
              Decline
            </Button>
            <Button type='primary' onClick={() => {}}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
