import { User } from '@/types'
import { UserAvatar } from './userSidebarItem'
import Icon from './icon'
import { StaticImageData } from 'next/image'

export function TopBarButton({
  title,
  icon,
  onClick,
}: {
  title?: string
  icon?: StaticImageData
  onClick: () => void
}) {
  return (
    <div
      className='flex items-center gap-1 px-2 py-1 font-regular bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-25 hover:border-gray-300'
      onClick={onClick}>
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
