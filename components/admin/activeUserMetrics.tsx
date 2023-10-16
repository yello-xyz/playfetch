import { ActiveUser, UserMetrics } from '@/types'
import Label from '@/components/label'
import { UserAvatar } from '@/components/userSidebarItem'
import { FormatDate } from '@/src/common/formatting'
import Icon from '../icon'
import backIcon from '@/public/back.svg'

export default function ActiveUserMetrics({
  user,
  metrics,
  onDismiss,
}: {
  user: ActiveUser
  metrics: UserMetrics
  onDismiss: () => void
}) {
  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        <Label onClick={onDismiss} className='flex items-center cursor-pointer'>
          <Icon icon={backIcon} />
          Back to Active Users
        </Label>
        <div className='flex flex-col w-full gap-2 p-4 bg-white border border-gray-200 rounded-lg'>
          <div className='flex items-center gap-2'>
            <UserAvatar user={user} />
            <Label>
              {user.fullName} ({user.email})
            </Label>
          </div>
          <Label>Last Active: {FormatDate(user.lastActive, true, true)}</Label>
          <Label>Number of additional workspaces created: {metrics.createdWorkspaceCount - 1}</Label>
          <Label>
            Number of additional workspaces shared with user:{' '}
            {metrics.workspaceAccessCount - metrics.createdWorkspaceCount}
          </Label>
          <Label>Number of additional projects shared with user: {metrics.projectAccessCount}</Label>
        </div>
      </div>
    </>
  )
}
