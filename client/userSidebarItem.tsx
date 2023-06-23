import { User } from '@/types'
import api from './api'
import PopupMenu from './popupMenu'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import { useRefreshPage } from './refreshContext'

export default function UserSidebarItem({ user }: { user: User }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshPage = useRefreshPage()

  const logout = async () => {
    await api.logout()
    refreshPage()
  }

  return (
    <div
      className='flex gap-2.5 items-center relative cursor-pointer'
      onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
      <Avatar user={user} />
      <span className='flex-1 font-semibold'>{user.fullName}</span>
      <div className='flex'>
        <img className='w-6 h-6' src={chevronIcon.src} />
        {isMenuExpanded && (
          <div className='absolute top-0 left-0'>
            <PopupMenu className='w-60' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
              <div className='flex flex-col items-stretch gap-4 p-3'>
                <div className='flex items-center gap-2.5'>
                  <Avatar user={user} />
                  <div className='flex flex-col'>
                    <span className='font-semibold'>{user.fullName}</span>
                    <span className='text-xs'>{user.email}</span>
                  </div>
                </div>
                <div className='border-t border-gray-300'/>
                <span className='p-1 font-medium text-red-700' onClick={logout}>Log out</span>
              </div>
            </PopupMenu>
          </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ user }: { user: User }) {
  return (
    <div className={`${user.avatarColor} font-semibold rounded-full w-7 h-7 flex items-center justify-center`}>
      {user.fullName.slice(0, 1)}
    </div>
  )
}
