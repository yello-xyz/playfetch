import { withAdminSession } from '@/src/server/session'
import { ActiveUser, RecentProject, User, UserMetrics } from '@/types'
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
import { getRecentProjects } from '@/src/server/datastore/projects'
import RecentProjects from '@/components/admin/recentProjects'

const WaitlistItem = 'waitlist'
const ActiveUsersItem = 'activeUsers'
const RecentProjectsItem = 'recentProjects'
type ActiveItem = typeof WaitlistItem | typeof ActiveUsersItem | ActiveUser | typeof RecentProjectsItem

export const getServerSideProps = withAdminSession(async ({ query }) => {
  const { w: waitlist, u: userID, r: projects } = ParseNumberQuery(query)

  const activeUsers = await getActiveUsers()
  const waitlistUsers = await getUsersWithoutAccess()
  const recentProjects = await getRecentProjects()

  const initialActiveItem: ActiveItem = waitlist
    ? WaitlistItem
    : projects
    ? RecentProjectsItem
    : userID
    ? { ...activeUsers.find(user => user.id === userID)! }
    : ActiveUsersItem

  const initialUserMetrics = userID ? await getMetricsForUser(userID) : null

  return { props: { initialActiveItem, initialUserMetrics, activeUsers, waitlistUsers, recentProjects } }
})

export default function Admin({
  initialActiveItem,
  initialUserMetrics,
  activeUsers,
  waitlistUsers,
  recentProjects,
}: {
  initialActiveItem: ActiveItem
  initialUserMetrics: UserMetrics | null
  activeUsers: ActiveUser[]
  waitlistUsers: User[]
  recentProjects: RecentProject[]
}) {
  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const [userMetrics, setUserMetrics] = useState(initialUserMetrics)

  const router = useRouter()

  const selectItem = (item: typeof WaitlistItem | typeof ActiveUsersItem | typeof RecentProjectsItem | number) => {
    router.push(
      `/admin${
        item === WaitlistItem
          ? '?w=1'
          : item === RecentProjectsItem
          ? '?r=1'
          : item !== ActiveUsersItem
          ? `?u=${item}`
          : ''
      }`,
      undefined,
      {
        shallow: true,
      }
    )
  }

  const { w: waitlist, u: userID, r: projects } = ParseNumberQuery(router.query)
  const currentQueryState = waitlist ? WaitlistItem : projects ? RecentProjectsItem : userID ?? ActiveUsersItem
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    setUserMetrics(null)
    if (userID) {
      setActiveItem(activeUsers.find(user => user.id === userID)!)
      api.getUserMetrics(userID).then(setUserMetrics)
    } else {
      setActiveItem(waitlist ? WaitlistItem : projects ? RecentProjectsItem : ActiveUsersItem)
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
            onSelectRecentProjects={() => selectItem(RecentProjectsItem)}
          />
          <div className='flex flex-col flex-1 bg-gray-25'>
            {activeItem === WaitlistItem ? (
              <Waitlist initialWaitlistUsers={waitlistUsers} />
            ) : activeItem === ActiveUsersItem ? (
              <ActiveUsers activeUsers={activeUsers} onSelectUser={selectItem} />
            ) : activeItem === RecentProjectsItem ? (
              <RecentProjects recentProjects={recentProjects} />
            ) : userMetrics ? (
              <ActiveUserMetrics user={activeItem} metrics={userMetrics} onDismiss={() => router.back()} />
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}
