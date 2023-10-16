import { Fragment } from 'react'
import { ActiveUser } from '@/types'
import Label from '@/components/label'
import { UserAvatar } from '@/components/userSidebarItem'
import { FormatDate } from '@/src/common/formatting'

export default function ActiveUsers({ activeUsers }: { activeUsers: ActiveUser[] }) {
  const gridConfig = 'grid grid-cols-[28px_minmax(0,1fr)_240px]'

  const startDate = Math.min(...activeUsers.map(user => user.startTimestamp))

  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        {activeUsers.length > 0 && (
          <>
            <Label>Active Users (since {FormatDate(startDate)})</Label>
            <div className={`${gridConfig} w-full bg-white items-center gap-2 p-2 border-gray-200 border rounded-lg`}>
              {activeUsers.map(user => (
                <Fragment key={user.id}>
                  <UserAvatar user={user} />
                  <div className='overflow-hidden text-ellipsis'>{user.email}</div>
                  <div className='font-medium'>{user.fullName}</div>
                </Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
