import { User } from '@/types'
import PopupMenu from './popupMenu'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Icon from './icon'
import { useLoggedInUser } from './userContext'

const avatarColors = [
  'bg-orange-300',
  'bg-purple-300',
  'bg-green-300',
  'bg-blue-300',
  'bg-yellow-300',
  'bg-red-400',
  'bg-orange-400',
  'bg-purple-400',
  'bg-green-400',
  'bg-blue-400',
  'bg-yellow-400',
]

const getAvatarColor = (user: User) => {
  const charCodeSum = user.fullName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarColors[charCodeSum % avatarColors.length]
}

type Size = 'xs' | 'sm' | 'md' | 'lg'

export function UserAvatar({ user, size = 'lg', border }: { user: User; size?: Size; border?: boolean }) {
  const width = (size: Size) => {
    switch (size) {
      case 'xs':
        return 14
      case 'sm':
        return 18
      case 'md':
        return 22
      case 'lg':
        return 28
    }
  }
  const sizeClass = (size: Size) => {
    switch (size) {
      case 'xs':
        return 'w-3.5 h-3.5'
      case 'sm':
        return 'w-[18px] h-[18px]'
      case 'md':
        return 'w-[22px] h-[22px]'
      case 'lg':
        return 'w-7 h-7 min-w-[28px]'
    }
  }
  const textClass = (size: Size) => {
    switch (size) {
      case 'xs':
        return 'text-[8px]'
      case 'sm':
        return 'text-[10px]'
      case 'md':
        return 'text-xs'
      case 'lg':
        return `font-medium ${border ? 'text-xs' : 'text-sm'}`
    }
  }
  const borderClass = border ? 'border-2 border-white' : ''
  const baseClass = 'rounded-full flex items-center justify-center'
  return user.imageURL.length ? (
    <Image
      width={width(size)}
      height={width(size)}
      className={`${sizeClass(size)} ${borderClass} rounded-full`}
      src={user.imageURL}
      alt='avatar'
    />
  ) : (
    <div className={`${sizeClass(size)} ${borderClass} ${textClass(size)} ${getAvatarColor(user)} ${baseClass}`}>
      {user.fullName.slice(0, 1).toUpperCase()}
    </div>
  )
}

export default function UserSidebarItem() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const user = useLoggedInUser()

  const selectSettings = () => {
    setIsMenuExpanded(false)
    user.showSettings()
  }

  return (
    <div
      className='flex pl-4 gap-2.5 items-center relative cursor-pointer'
      onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
      <UserAvatar user={user} />
      <span className='flex-1 font-semibold'>{user.fullName}</span>
      <div className='flex'>
        <Icon icon={chevronIcon} />
        {isMenuExpanded && (
          <div className='absolute top-0 left-0'>
            <PopupMenu className='w-60' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
              <div className='flex flex-col items-stretch gap-2.5 p-3'>
                <div className='flex items-center gap-2.5'>
                  <UserAvatar user={user} />
                  <div className='flex flex-col min-w-0'>
                    <span className='overflow-hidden font-semibold text-ellipsis'>{user.fullName}</span>
                    <span className='overflow-hidden text-xs text-ellipsis'>{user.email}</span>
                  </div>
                </div>
                <span className='p-1 font-medium cursor-pointer' onClick={selectSettings}>
                  Settings
                </span>
                <div className='border-t border-gray-300' />
                <span className='p-1 font-medium text-red-500 cursor-pointer' onClick={() => signOut()}>
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
