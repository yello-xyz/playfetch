import { withAdminSession } from '@/src/server/session'
import { ActiveUser, ProjectMetrics, RecentProject, User, UserMetrics } from '@/types'
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
import { getMetricsForProject, getRecentProjects } from '@/src/server/datastore/projects'
import RecentProjects from '@/components/admin/recentProjects'
import RecentProjectMetrics from '@/components/admin/recentProjectMetrics'

const WaitlistItem = 'waitlist'
const ActiveUsersItem = 'activeUsers'
const RecentProjectsItem = 'recentProjects'
type ActiveItem = typeof WaitlistItem | typeof ActiveUsersItem | typeof RecentProjectsItem | ActiveUser | RecentProject
const activeItemIsUser = (item: ActiveItem): item is ActiveUser => typeof item === 'object' && 'fullName' in item
const activeItemIsProject = (item: ActiveItem): item is RecentProject => typeof item === 'object' && 'name' in item

export const getServerSideProps = withAdminSession(async ({ query }) => {
  const { w: waitlist, p: projects, i: itemID } = ParseNumberQuery(query)

  const activeUsers = await getActiveUsers()
  const waitlistUsers = await getUsersWithoutAccess()
  const recentProjects = await getRecentProjects()

  const activeUser = activeUsers.find(user => user.id === itemID)
  const recentProject = recentProjects.find(project => project.id === itemID)

  const initialActiveItem: ActiveItem = waitlist
    ? WaitlistItem
    : projects
    ? RecentProjectsItem
    : activeUser ?? recentProject ?? ActiveUsersItem

  const initialUserMetrics = activeUser ? await getMetricsForUser(activeUser.id) : null
  const initialProjectMetrics = recentProject
    ? await getMetricsForProject(recentProject.id, recentProject.workspaceID)
    : null

  return {
    props: { initialActiveItem, initialUserMetrics, initialProjectMetrics, activeUsers, waitlistUsers, recentProjects },
  }
})

export default function Admin({
  initialActiveItem,
  initialUserMetrics,
  initialProjectMetrics,
  activeUsers,
  recentProjects,
  waitlistUsers,
}: {
  initialActiveItem: ActiveItem
  initialUserMetrics: UserMetrics | null
  initialProjectMetrics: ProjectMetrics | null
  activeUsers: ActiveUser[]
  waitlistUsers: User[]
  recentProjects: RecentProject[]
}) {
  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const [userMetrics, setUserMetrics] = useState(initialUserMetrics)
  const [projectMetrics, setProjectMetrics] = useState(initialProjectMetrics)

  const router = useRouter()

  const selectItem = (item: typeof WaitlistItem | typeof ActiveUsersItem | typeof RecentProjectsItem | number) => {
    router.push(
      `/admin${
        item === WaitlistItem
          ? '?w=1'
          : item === RecentProjectsItem
          ? '?p=1'
          : item !== ActiveUsersItem
          ? `?i=${item}`
          : ''
      }`,
      undefined,
      {
        shallow: true,
      }
    )
  }

  const { w: waitlist, p: projects, i: itemID } = ParseNumberQuery(router.query)
  const currentQueryState = waitlist ? WaitlistItem : projects ? RecentProjectsItem : itemID ?? ActiveUsersItem
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    setUserMetrics(null)
    setProjectMetrics(null)
    const activeUser = [...activeUsers, ...(projectMetrics?.users ?? [])].find(user => user.id === itemID)
    const recentProject = recentProjects.find(project => project.id === itemID)
    if (activeUser) {
      setActiveItem(activeUser)
      api.getUserMetrics(activeUser.id).then(setUserMetrics)
    } else if (recentProject) {
      setActiveItem(recentProject)
      api.getProjectMetrics(recentProject.id, recentProject.workspaceID).then(setProjectMetrics)
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
            {activeItem === WaitlistItem && <Waitlist initialWaitlistUsers={waitlistUsers} />}
            {activeItem === ActiveUsersItem && <ActiveUsers activeUsers={activeUsers} onSelectUser={selectItem} />}
            {activeItem === RecentProjectsItem && (
              <RecentProjects recentProjects={recentProjects} onSelectProject={selectItem} />
            )}
            {userMetrics && activeItemIsUser(activeItem) && (
              <ActiveUserMetrics user={activeItem} metrics={userMetrics} onDismiss={() => router.back()} />
            )}
            {projectMetrics && activeItemIsProject(activeItem) && (
              <RecentProjectMetrics
                project={activeItem}
                metrics={projectMetrics}
                onSelectUser={selectItem}
                onDismiss={() => router.back()}
              />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
