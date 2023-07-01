import { User } from '@/types'
import PopupMenu from './popupMenu'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

export function UserAvatar({ user, size = 'md', border }: { user: User; size?: 'xs' | 'sm' | 'md'; border?: boolean }) {
  const sizeClass = size === 'xs' ? 'w-3.5 h-3.5' : size === 'sm' ? 'w-[18px] h-[18px]' : 'w-7 h-7'
  const borderClass = border ? 'border-2 border-white' : ''
  return <img className={`${sizeClass} ${borderClass} rounded-full`} src={user.imageURL} />
}

export default function UserSidebarItem({ user }: { user: User }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  return (
    <div
      className='flex pl-4 gap-2.5 items-center relative cursor-pointer'
      onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
      <UserAvatar user={user} />
      <span className='flex-1 font-semibold'>{user.fullName}</span>
      <div className='flex'>
        <img className='w-6 h-6' src={chevronIcon.src} />
        {isMenuExpanded && (
          <div className='absolute top-0 left-0'>
            <PopupMenu className='w-60' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
              <div className='flex flex-col items-stretch gap-4 p-3'>
                <div className='flex items-center gap-2.5'>
                  <UserAvatar user={user} />
                  <div className='flex flex-col'>
                    <span className='font-semibold'>{user.fullName}</span>
                    <span className='text-xs'>{user.email}</span>
                  </div>
                </div>
                <div className='border-t border-gray-300' />
                <span className='p-1 font-medium text-red-700' onClick={() => signOut()}>
                  Log out
                </span>
              </div>
            </PopupMenu>
          </div>
        )}
      </div>
    </div>
  )
}
