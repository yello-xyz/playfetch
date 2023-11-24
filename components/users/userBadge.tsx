import { ReactNode } from 'react'
import UserAvatar from './userAvatar'
import { User } from '@/types'

export default function UserBadge({
  user,
  suffix,
  padding = 'p-2',
  children,
}: {
  user: User
  suffix?: string
  padding?: string
  children?: ReactNode
}) {
  return (
    <div className={`flex items-center gap-2.5 ${padding}`}>
      <UserAvatar user={user} />
      <div className='flex flex-col flex-1 min-w-0'>
        <div className='flex items-center gap-1 overflow-hidden text-gray-700 select-none text-ellipsis'>
          <span className='font-semibold'>{user.fullName}</span>
          {suffix && <span>{suffix}</span>}
        </div>
        <span className='overflow-hidden text-xs text-gray-400 select-none text-ellipsis'>{user.email}</span>
      </div>
      {children}
    </div>
  )
}
