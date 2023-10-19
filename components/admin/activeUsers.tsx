import { ReactNode } from 'react'
import { ActiveUser } from '@/types'
import Label from '@/components/label'
import UserAvatar from '@/components/users/userAvatar'
import { FormatDate } from '@/src/common/formatting'

export default function ActiveUsers({
  title = 'Active Users',
  activeUsers,
  onSelectUser,
  embedded,
}: {
  title?: string
  activeUsers: ActiveUser[]
  onSelectUser: (userID: number) => void
  embedded?: boolean
}) {
  const gridConfig = 'grid grid-cols-[100px_200px_minmax(0,1fr)_100px_100px_100px_100px_100px]'

  const startDate = Math.min(...activeUsers.map(user => user.startTimestamp))

  return (
    <>
      <div className={`flex flex-col items-start gap-4 ${embedded ? '' : 'p-6 overflow-y-auto'}`}>
        {activeUsers.length > 0 && (
          <>
            <Label>{title} (data since {FormatDate(startDate)})</Label>
            <div className={`${gridConfig} bg-white items-center border-gray-200 border rounded-lg`}>
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
                <div key={user.id} className='cursor-pointer contents group' onClick={() => onSelectUser(user.id)}>
                  <TableCell>{FormatDate(user.lastActive, false)}</TableCell>
                  <TableCell>
                    <UserAvatar user={user} /> {user.fullName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell center>{user.commentCount}</TableCell>
                  <TableCell center>{user.versionCount}</TableCell>
                  <TableCell center>{user.promptCount}</TableCell>
                  <TableCell center>{user.chainCount}</TableCell>
                  <TableCell center>{user.endpointCount}</TableCell>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

const TableCell = ({ children, center }: { children: ReactNode; center?: boolean }) => (
  <div
    className={`flex items-center gap-2 px-2 h-10 overflow-hidden font-medium text-ellipsis group-hover:bg-gray-50 ${
      center ? 'justify-center' : ''
    }`}>
    {children}
  </div>
)
