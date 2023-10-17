import { User } from '@/types'
import UserAvatar from './userAvatar'
import UserBadge from './userBadge'

export function UserAvatars({ users }: { users: User[] }) {
  return users.length > 1 ? (
    <div
      className='flex flex-row-reverse space-x-reverse -space-x-[50px]'
      style={{ marginRight: `${(users.length - 1) * 22}px` }}>
      {users.map((user, index) => (
        <div key={index} className='relative group'>
          <UserAvatar user={user} border />
          <div className='absolute left-3.5 z-10 justify-center hidden overflow-visible group-hover:flex top-8 max-w-0'>
            <span className='text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md whitespace-nowrap'>
              <UserBadge user={user} />
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : null
}
