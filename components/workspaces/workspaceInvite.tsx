import { PendingWorkspace, User } from '@/types'
import WorkspaceTopBar from './workspaceTopBar'
import { FormatRelativeDate } from '@/src/common/formatting'
import Button from '../button'
import UserAvatar from '../users/userAvatar'

export default function WorkspaceInvite({
  workspace,
  onRespond,
}: {
  workspace: PendingWorkspace
  onRespond: (accept: boolean) => void
}) {
  return (
    <div className='flex flex-col h-full'>
      <WorkspaceTopBar activeWorkspace={workspace} />
      <div className='p-6'>
        <InviteCell item={workspace} onRespond={onRespond} />
      </div>
    </div>
  )
}

function InviteCell({
  item,
  onRespond,
}: {
  item: {
    name: string
    invitedBy: User
    timestamp: number
  }
  onRespond: (accept: boolean) => void
}) {
  return (
    <div className='flex items-center justify-between w-full gap-6 px-4 py-3 border border-gray-200 rounded-lg select-none bg-gray-25'>
      <div className='flex flex-col gap-2'>
        <span className='flex-1 text-base font-medium text-gray-700 line-clamp-2'>{item.name}</span>
        <div className='flex items-center gap-2 text-sm'>
          <UserAvatar size='md' user={item.invitedBy} />
          <span className='text-gray-700'>{item.invitedBy.fullName} invited you</span>
          <span className='-ml-1 text-gray-400'>• {FormatRelativeDate(item.timestamp)}</span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Button type='outline' onClick={() => onRespond(false)}>
          Decline
        </Button>
        <Button type='primary' onClick={() => onRespond(true)}>
          Accept
        </Button>
      </div>
    </div>
  )
}
