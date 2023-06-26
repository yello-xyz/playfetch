import { User } from '@/types'
import api from './api'
import PopupMenu from './popupMenu'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import { useRefreshPage } from './refreshContext'

export function UserAvatar({
  user,
  size = 'medium',
  border,
}: {
  user: User
  size?: 'small' | 'medium'
  border?: boolean
}) {
  const sizeClass = size === 'small' ? 'w-[18px] h-[18px]' : 'w-7 h-7 font-medium'
  const borderClass = border ? 'border-2 border-white' : ''
  const textClass = size === 'small' ? 'text-[10px]' : border ? 'text-xs' : 'text-sm'
  const baseClass = 'rounded-full flex items-center justify-center'
  return (
    <div className={`${sizeClass} ${borderClass} ${textClass} ${user.avatarColor} ${baseClass}`}>
      {user.fullName.slice(0, 1)}
    </div>
  )
}

export default function UserSidebarItem({ user }: { user: User }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshPage = useRefreshPage()

  const logout = async () => {
    await api.logout()
    refreshPage()
  }

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
                <span className='p-1 font-medium text-red-700' onClick={logout}>
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
