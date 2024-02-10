import PopupMenu, { PopupSectionDivider } from '@/src/client/components/popupMenu'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Icon from '@/src/client/components/icon'
import { useLoggedInUser } from '@/src/client/users/userContext'
import api from '@/src/client/api'
import Link from 'next/link'
import ClientRoute, { UserSettingsRoute } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import UserAvatar from './userAvatar'
import UserBadge from './userBadge'

export default function UserSidebarItem() {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const user = useLoggedInUser()
  const router = useRouter()

  const selectSettings = () => {
    setMenuExpanded(false)
    router.push(UserSettingsRoute())
  }

  const logOut = async () => api.logOut().then(() => signOut())

  return (
    <div
      className='flex pl-3 pr-1.5 py-2 gap-2.5 items-center relative cursor-pointer rounded-lg hover:bg-gray-100 '
      onClick={() => setMenuExpanded(!isMenuExpanded)}>
      <UserAvatar user={user} />
      <span className='flex-1 font-semibold text-gray-700'>{user.fullName}</span>
      <div className='flex'>
        <Icon icon={chevronIcon} />
        {isMenuExpanded && (
          <div className='absolute top-0 left-1.5 shadow-sm'>
            <PopupMenu className='w-60' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
              <div className='flex flex-col items-stretch gap-0.5 p-3 pt-1 select-none'>
                <UserBadge user={user} />
                <span
                  className='px-2 py-1 font-medium leading-6 text-gray-700 rounded cursor-pointer select-none hover:bg-gray-50'
                  onClick={selectSettings}>
                  Settings
                </span>
                {user.isAdmin && (
                  <Link
                    href={ClientRoute.Admin}
                    className='w-full px-2 py-1 leading-6 rounded select-none hover:bg-gray-50'>
                    <span className='font-medium text-gray-700 cursor-pointer'>Admin</span>
                  </Link>
                )}
                <PopupSectionDivider />
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
