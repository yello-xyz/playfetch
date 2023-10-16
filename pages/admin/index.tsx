import { withAdminSession } from '@/src/server/session'
import { ActiveUser, User } from '@/types'
import { getActiveUsers, getUsersWithoutAccess } from '@/src/server/datastore/users'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import AdminSidebar from '@/components/admin/adminSidebar'
import Waitlist from '@/components/admin/waitlist'
import { ParseNumberQuery } from '@/src/client/clientRoute'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ActiveUsers from '@/components/admin/activeUsers'
import UserMetrics from '@/components/admin/userMetrics'

const WaitlistItem = 'waitlist'
const ActiveUsersItem = 'activeUsers'
type ActiveItem = typeof WaitlistItem | typeof ActiveUsersItem | ActiveUser

export const getServerSideProps = withAdminSession(async ({ query }) => {
  const { w: waitlist, u: userID } = ParseNumberQuery(query)

  const activeUsers = await getActiveUsers()
  const waitlistUsers = await getUsersWithoutAccess()

  const initialActiveItem: ActiveItem = waitlist
    ? WaitlistItem
    : userID
    ? { ...activeUsers.find(user => user.id === userID)! }
    : ActiveUsersItem

  return { props: { initialActiveItem, activeUsers, waitlistUsers } }
})

export default function Admin({
  initialActiveItem,
  activeUsers,
  waitlistUsers,
}: {
  initialActiveItem: ActiveItem
  activeUsers: ActiveUser[]
  waitlistUsers: User[]
}) {
  const [activeItem, setActiveItem] = useState(initialActiveItem)

  const router = useRouter()

  const selectItem = (item: ActiveItem) => {
    setActiveItem(item)
    router.push(
      `/admin${item === WaitlistItem ? '?w=1' : item !== ActiveUsersItem ? `?u=${item.id}` : ''}`,
      undefined,
      { shallow: true }
    )
  }

  const selectUser = (userID: number) => {
    const user = activeUsers.find(user => user.id === userID)
    if (user) {
      selectItem(user)
    }
  }

  const { w: waitlist, u: userID } = ParseNumberQuery(router.query)
  const currentQueryState = waitlist ? WaitlistItem : userID ?? ActiveUsersItem
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    if (userID) {
      selectUser(userID)
    } else {
      selectItem(waitlist ? WaitlistItem : ActiveUsersItem)
    }
    setQuery(currentQueryState)
  }

  return (
    <>
      <main className='flex flex-col h-screen text-sm'>
        <TopBar>
          <TopBarBackItem />
          <span className='text-base font-medium'>Admin</span>
          <TopBarAccessoryItem />
        </TopBar>
        <div className='flex items-stretch flex-1 overflow-hidden'>
          <AdminSidebar
            onSelectWaitlist={() => selectItem(WaitlistItem)}
            onSelectActiveUsers={() => selectItem(ActiveUsersItem)}
          />
          <div className='flex flex-col flex-1 bg-gray-25'>
            {activeItem === WaitlistItem ? (
              <Waitlist initialWaitlistUsers={waitlistUsers} />
            ) : activeItem === ActiveUsersItem ? (
              <ActiveUsers activeUsers={activeUsers} onSelectUser={selectUser} />
            ) : (
              <UserMetrics user={activeItem} />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
