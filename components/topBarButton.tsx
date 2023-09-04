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
}: {
  type?: ButtonType
  title?: string
  icon?: StaticImageData
  onClick: () => void
}) {
  const baseClass = 'flex items-center gap-0.5 pl-1.5 pr-1.5 py-1 font-medium rounded-lg cursor-pointer '

  const colorForType = (type: ButtonType) => {
    switch (type) {
      default:
      case 'primary':
        return baseClass + 'text-white bg-blue-400 hover:bg-blue-500'
      case 'outline':
        return 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
    }
  }

  return (
    <div className={`${baseClass} ${colorForType(type)}`} onClick={onClick}>
      {icon && <Icon icon={icon} />}
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
        <div key={index}>
          <UserAvatar user={user} border />
        </div>
      ))}
    </div>
  ) : null
}
