import { ActiveUser } from '@/types'
import Label from '@/src/client/components/label'
import UserAvatar from '@/src/client/users/userAvatar'
import { FormatDate } from '@/src/common/formatting'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import TableRow, { TableCell, TruncatedSpan } from './tableRow'

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
  const gridConfig = 'grid grid-cols-[100px_200px_minmax(0,1fr)_100px_100px_100px_100px_100px_100px]'

  const startDate = useFormattedDate(Math.min(...activeUsers.map(user => user.startTimestamp)))
  const canFetchBefore = onFetchBefore && activeUsers.length > 0

  return (
    <>
      <div className={`flex flex-col items-start gap-4 ${embedded ? '' : 'p-6 overflow-y-auto'}`}>
        <Label>
          {title} {canFetchBefore && `(data since ${startDate})`}
          {canFetchBefore && (
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
            <Label># Runs</Label>
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
    <TableRow onClick={() => onSelectUser(user.id)}>
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
      <TableCell center>{user.runCount}</TableCell>
      <TableCell center>{user.promptCount}</TableCell>
      <TableCell center>{user.chainCount}</TableCell>
      <TableCell center>{user.endpointCount}</TableCell>
    </TableRow>
  )
}
