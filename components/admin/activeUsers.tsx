import { ReactNode } from 'react'
import { ActiveUser } from '@/types'
import Label from '@/components/label'
import UserAvatar from '@/components/users/userAvatar'
import { FormatDate } from '@/src/common/formatting'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'

export default function ActiveUsers({
  title = 'Active Users',
  activeUsers,
  onSelectUser,
  onFetchBefore,
  embedded,
}: {
  title?: string
  activeUsers: ActiveUser[]
  onSelectUser: (userID: number) => void
  onFetchBefore?: () => void
  embedded?: boolean
}) {
  const gridConfig = 'grid grid-cols-[100px_200px_minmax(0,1fr)_100px_100px_100px_100px_100px]'

  const startDate = useFormattedDate(Math.min(...activeUsers.map(user => user.startTimestamp)))

  return (
    <>
      <div className={`flex flex-col items-start gap-4 ${embedded ? '' : 'p-6 overflow-y-auto'}`}>
        <Label>
          {title} {activeUsers.length > 0 && `(data since ${startDate})`}
          {onFetchBefore && activeUsers.length > 0 && (
            <span className='px-2 font-medium underline cursor-pointer' onClick={onFetchBefore}>
              fetch earlier data
            </span>
          )}
        </Label>
        <div className={`${gridConfig} bg-white items-center border-gray-200 border rounded-lg p-2`}>
          <TableCell>
            <Label>Last Active</Label>
          </TableCell>
          <TableCell>
            <Label>Name</Label>
          </TableCell>
          <TableCell>
            <Label>Email</Label>
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
          {activeUsers.map(user => (
            <UserRow key={user.id} user={user} onSelectUser={onSelectUser} />
          ))}
        </div>
      </div>
    </>
  )
}

function UserRow({ user, onSelectUser }: { user: ActiveUser; onSelectUser: (userID: number) => void }) {
  const lastActive = useFormattedDate(user.lastActive, timestamp => FormatDate(timestamp, false))

  return (
    <div className='cursor-pointer contents group' onClick={() => onSelectUser(user.id)}>
      <TableCell>{lastActive}</TableCell>
      <TableCell>
        <UserAvatar user={user} />
        <TruncatedSpan>{user.fullName}</TruncatedSpan>
      </TableCell>
      <TableCell>
        <TruncatedSpan>{user.email}</TruncatedSpan>
      </TableCell>
      <TableCell center>{user.commentCount}</TableCell>
      <TableCell center>{user.versionCount}</TableCell>
      <TableCell center>{user.promptCount}</TableCell>
      <TableCell center>{user.chainCount}</TableCell>
      <TableCell center>{user.endpointCount}</TableCell>
    </div>
  )
}

const TableCell = ({ children, center }: { children: ReactNode; center?: boolean }) => (
  <div
    className={`flex items-center gap-2 px-2 h-10 font-medium group-hover:bg-gray-50 ${
      center ? 'justify-center' : ''
    }`}>
    {children}
  </div>
)

const TruncatedSpan = ({ children }: { children: ReactNode }) => (
  <span className='overflow-hidden whitespace-nowrap text-ellipsis'>{children}</span>
)
