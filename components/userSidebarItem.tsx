import { User } from '@/types'
import PopupMenu from './popupMenu'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Icon from './icon'
import { useLoggedInUser } from './userContext'
import NextAuthAdapter from '@/src/server/datastore/nextAuthAdapter'
import api from '@/src/client/api'
import Link from 'next/link'
import ClientRoute from './clientRoute'

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
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const user = useLoggedInUser()

  const selectSettings = () => {
    setMenuExpanded(false)
    user.showSettings()
  }

  const logOut = async () => api.logOut().then(() => signOut())

  return (
    <div
      className='flex pl-3 pr-1.5 py-2 gap-2.5 items-center relative cursor-pointer rounded-lg hover:bg-gray-100 '
      onClick={() => setMenuExpanded(!isMenuExpanded)}>
      <UserAvatar user={user} />
      <span className='flex-1 font-semibold text-dark-gray-700'>{user.fullName}</span>
      <div className='flex'>
        <Icon icon={chevronIcon} />
        {isMenuExpanded && (
          <div className='absolute top-0 left-1.5'>
            <PopupMenu className='w-60' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
              <div className='flex flex-col items-stretch gap-0.5 p-3 select-none'>
                <div className='flex items-center gap-2.5 pb-2 px-2'>
                  <UserAvatar user={user} />
                  <div className='flex flex-col min-w-0'>
                    <span className='overflow-hidden font-semibold select-none text-ellipsis text-dark-gray-700'>
                      {user.fullName}
                    </span>
                    <span className='overflow-hidden text-xs select-none text-ellipsis text-dark-gray-400'>
                      {user.email}
                    </span>
                  </div>
                </div>
                <span
                  className='px-2 py-1 font-medium leading-6 rounded cursor-pointer select-none text-dark-gray-700 hover:bg-gray-50'
                  onClick={selectSettings}>
                  Settings
                </span>
                {user.isAdmin && (
                  <Link
                    href={ClientRoute.Admin}
                    className='w-full px-2 py-1 leading-6 rounded select-none hover:bg-gray-50'>
                    <span className='font-medium cursor-pointer text-dark-gray-700'>Admin</span>
                  </Link>
                )}
                <div className='pt-1 pb-1'>
                  <div className='h-px bg-gray-200' />
                </div>
                <span
                  className='px-2 py-1 font-medium leading-6 text-red-500 rounded cursor-pointer select-none hover:bg-red-50'
                  onClick={logOut}>
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
