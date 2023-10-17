import { User } from '@/types'
import { UserAvatar } from './userSidebarItem'
import Icon from './icon'
import { StaticImageData } from 'next/image'

type ButtonType = 'primary' | 'outline'

export function TopBarButton({
  type = 'outline',
  title,
  icon,
  onClick,
  disabled,
  iconClassName = '',
}: {
  type?: ButtonType
  title?: string
  icon?: StaticImageData
  onClick: () => void
  disabled?: boolean
  iconClassName?: string
}) {
  const baseClass = 'flex items-center gap-0.5 pl-1.5 pr-1.5 py-1 font-medium rounded-lg'

  const colorForType = (type: ButtonType) => {
    switch (type) {
      default:
      case 'primary':
        const primaryDisabled = disabled ? 'bg-blue-200' : 'bg-blue-400 hover:bg-blue-500'
        return `${primaryDisabled} text-white`
      case 'outline':
        const outlineDisabled = disabled ? 'opacity-50' : 'hover:bg-gray-50 hover:border-gray-300'
        return `${outlineDisabled} text-gray-700 bg-white border border-gray-200`
    }
  }

  return (
    <div className={`${baseClass} ${disabled ? '' : 'cursor-pointer'} ${colorForType(type)}`} onClick={onClick}>
      {icon && <Icon icon={icon} className={iconClassName} />}
      {title && <div className={icon ? 'pr-2' : 'px-2 py-0.5'}>{title}</div>}
    </div>
  )
}

export function UserAvatars({ users }: { users: User[] }) {
  return users.length > 1 ? (
    <div
      className='flex flex-row-reverse space-x-reverse -space-x-[50px]'
      style={{ marginRight: `${(users.length - 1) * 22}px` }}>
      {users.map((user, index) => (
        <div key={index} className='relative group'>
          <UserAvatar user={user} border />
          <div className='absolute left-3.5 z-10 justify-center hidden overflow-visible group-hover:flex top-8 max-w-0'>
            <span className='px-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded whitespace-nowrap'>
              {user.fullName}
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : null
}
