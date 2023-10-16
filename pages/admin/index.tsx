import { withAdminSession } from '@/src/server/session'
import { ActiveUser, User, UserMetrics } from '@/types'
import { getActiveUsers, getMetricsForUser, getUsersWithoutAccess } from '@/src/server/datastore/users'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import AdminSidebar from '@/components/admin/adminSidebar'
import Waitlist from '@/components/admin/waitlist'
import ClientRoute, { ParseNumberQuery } from '@/src/client/clientRoute'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ActiveUsers from '@/components/admin/activeUsers'
import ActiveUserMetrics from '@/components/admin/activeUserMetrics'
import api from '@/src/client/admin/api'

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

  const initialUserMetrics = userID ? await getMetricsForUser(userID) : null

  return { props: { initialActiveItem, initialUserMetrics, activeUsers, waitlistUsers } }
})

export default function Admin({
  initialActiveItem,
  initialUserMetrics,
  activeUsers,
  waitlistUsers,
}: {
  initialActiveItem: ActiveItem
  initialUserMetrics: UserMetrics | null
  activeUsers: ActiveUser[]
  waitlistUsers: User[]
}) {
  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const [userMetrics, setUserMetrics] = useState(initialUserMetrics)

  const router = useRouter()

  const selectItem = (item: typeof WaitlistItem | typeof ActiveUsersItem | number) => {
    router.push(`/admin${item === WaitlistItem ? '?w=1' : item !== ActiveUsersItem ? `?u=${item}` : ''}`, undefined, {
      shallow: true,
    })
  }

  const { w: waitlist, u: userID } = ParseNumberQuery(router.query)
  const currentQueryState = waitlist ? WaitlistItem : userID ?? ActiveUsersItem
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    setUserMetrics(null)
    if (userID) {
      setActiveItem(activeUsers.find(user => user.id === userID)!)
      api.getUserMetrics(userID).then(setUserMetrics)
    } else {
      setActiveItem(waitlist ? WaitlistItem : ActiveUsersItem)
    }
    setQuery(currentQueryState)
  }

  return (
    <>
      <main className='flex flex-col h-screen text-sm'>
        <TopBar>
        <TopBarBackItem title='Back to overview' onNavigateBack={() => router.push(ClientRoute.Home)} />
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
              <ActiveUsers activeUsers={activeUsers} onSelectUser={selectItem} />
            ) : userMetrics ? (
              <ActiveUserMetrics user={activeItem} metrics={userMetrics} onDismiss={() => router.back()} />
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}
