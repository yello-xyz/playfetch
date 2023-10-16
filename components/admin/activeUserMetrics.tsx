import { ReactNode } from 'react'
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
  const gridConfig = 'grid grid-cols-[28px_minmax(0,1fr)_200px_100px_100px_100px_100px_100px_100px]'

  const startDate = user.startTimestamp

  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        <Label onClick={onDismiss} className='flex items-center cursor-pointer'>
          <Icon icon={backIcon} />
          Back to Active Users
        </Label>
        <div className={`${gridConfig} w-full bg-white items-center gap-2 p-2 border-gray-200 border rounded-lg`}>
          <TableCell />
          <TableCell>
            <Label>Email</Label>
          </TableCell>
          <TableCell>
            <Label>Name</Label>
          </TableCell>
          <TableCell center>
            <Label>Last Active</Label>
          </TableCell>
          <TableCell center>
            <Label># Comments</Label>
          </TableCell>
          <TableCell center>
            <Label># Versions</Label>
          </TableCell>
          <TableCell center>
            <Label># Prompts</Label>
          </TableCell>
          <TableCell center>
            <Label># Chains</Label>
          </TableCell>
          <TableCell center>
            <Label># Endpoints</Label>
          </TableCell>
          <UserAvatar user={user} />
          <TableCell>{user.email}</TableCell>
          <TableCell>{user.fullName}</TableCell>
          <TableCell center>{FormatDate(user.lastActive, false)}</TableCell>
          <TableCell center>{user.commentCount}</TableCell>
          <TableCell center>{user.versionCount}</TableCell>
          <TableCell center>{user.promptCount}</TableCell>
          <TableCell center>{user.chainCount}</TableCell>
          <TableCell center>{user.endpointCount}</TableCell>
        </div>
      </div>
    </>
  )
}

const TableCell = ({ children, center }: { children?: ReactNode; center?: boolean }) => (
  <div className={`overflow-hidden font-medium text-ellipsis ${center ? 'text-center' : ''}`}>{children}</div>
)
