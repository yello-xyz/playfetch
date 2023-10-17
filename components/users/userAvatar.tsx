import { User } from '@/types'
import Image from 'next/image'

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

export default function UserAvatar({ user, size = 'lg', border }: { user: User; size?: Size; border?: boolean }) {
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
