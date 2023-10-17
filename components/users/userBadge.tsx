import UserAvatar from './userAvatar'
import { User } from '@/types'

export default function UserBadge({ user }: { user: User }) {
  return (
    <div className='flex items-center gap-2.5 pb-2 px-2'>
      <UserAvatar user={user} />
      <div className='flex flex-col min-w-0'>
        <span className='overflow-hidden font-semibold text-gray-700 select-none text-ellipsis'>{user.fullName}</span>
        <span className='overflow-hidden text-xs text-gray-400 select-none text-ellipsis'>{user.email}</span>
      </div>
    </div>
  )
}
