import { withAdminSession } from '@/src/server/session'
import { ActiveUser, ProjectMetrics, RecentProject, User, UserMetrics, Workspace, WorkspaceMetrics } from '@/types'
import { getActiveUsers, getMetricsForUser, getUsersWithoutAccess } from '@/src/server/datastore/users'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import AdminSidebar from '@/components/admin/adminSidebar'
import Waitlist from '@/components/admin/waitlist'
import ClientRoute, { ParseNumberQuery } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import { Suspense, useState } from 'react'
import ActiveUsers from '@/components/admin/activeUsers'
import api from '@/src/client/admin/api'
import { getMetricsForProject, getRecentProjects } from '@/src/server/datastore/projects'
import RecentProjects from '@/components/admin/recentProjects'

import dynamic from 'next/dynamic'
const ActiveUserMetrics = dynamic(() => import('@/components/admin/activeUserMetrics'))
const RecentProjectMetrics = dynamic(() => import('@/components/admin/recentProjectMetrics'))
const WorkspaceMetrics = dynamic(() => import('@/components/admin/workspaceMetrics'))

const WaitlistItem = 'waitlist'
const ActiveUsersItem = 'activeUsers'
const RecentProjectsItem = 'recentProjects'
type ActiveItem =
  | typeof WaitlistItem
  | typeof ActiveUsersItem
  | typeof RecentProjectsItem
  | ActiveUser
  | RecentProject
  | Workspace
const activeItemIsUser = (item: ActiveItem): item is ActiveUser => typeof item === 'object' && 'fullName' in item
const activeItemIsProject = (item: ActiveItem): item is RecentProject =>
  typeof item === 'object' && 'workspaceName' in item

export const getServerSideProps = withAdminSession(async ({ query }) => {
  const { w: waitlist, p: projects, i: itemID } = ParseNumberQuery(query)

  const initialActiveUsers = await getActiveUsers()
  const waitlistUsers = await getUsersWithoutAccess()
  const recentProjects = await getRecentProjects()

  const activeUser = initialActiveUsers.find(user => user.id === itemID)
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
    props: {
      initialActiveItem,
      initialUserMetrics,
      initialProjectMetrics,
      initialActiveUsers,
      waitlistUsers,
      recentProjects,
    },
  }
})

export default function Admin({
  initialActiveItem,
  initialUserMetrics,
  initialProjectMetrics,
  initialActiveUsers,
  recentProjects,
  waitlistUsers,
}: {
  initialActiveItem: ActiveItem
  initialUserMetrics: UserMetrics | null
  initialProjectMetrics: ProjectMetrics | null
  initialActiveUsers: ActiveUser[]
  waitlistUsers: User[]
  recentProjects: RecentProject[]
}) {
  const [activeItem, setActiveItem] = useState(initialActiveItem)
  const [userMetrics, setUserMetrics] = useState(initialUserMetrics)
  const [projectMetrics, setProjectMetrics] = useState(initialProjectMetrics)
  const [workspaceMetrics, setWorkspaceMetrics] = useState<WorkspaceMetrics>()
  const [activeUsers, setActiveUsers] = useState(initialActiveUsers)

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

  const fetchActiveUsersBefore = () =>
    api.getActiveUsers(Math.min(...activeUsers.map(user => user.startTimestamp))).then(setActiveUsers)

  const { w: waitlist, p: projects, i: itemID } = ParseNumberQuery(router.query)
  const currentQueryState = waitlist ? WaitlistItem : projects ? RecentProjectsItem : itemID ?? ActiveUsersItem
  const [query, setQuery] = useState(currentQueryState)
  if (currentQueryState !== query) {
    const knownUsers = [
      ...activeUsers,
      ...(projectMetrics?.users ?? []),
      ...(workspaceMetrics?.users ?? []),
      ...(workspaceMetrics?.pendingUsers ?? []),
    ]
    const knownProjects = [...recentProjects, ...(workspaceMetrics?.projects ?? [])]
    const knownWorkspaces: Workspace[] = [
      ...(userMetrics?.workspaces ?? []),
      ...(userMetrics?.pendingWorkspaces ?? []),
      ...recentProjects.map(project => ({ id: project.workspaceID, name: project.workspaceName })),
    ]

    const activeUser = knownUsers.find(user => user.id === itemID)
    const recentProject = knownProjects.find(project => project.id === itemID)
    const workspace = knownWorkspaces.find(workspace => workspace.id === itemID)

    setUserMetrics(null)
    setProjectMetrics(null)
    setWorkspaceMetrics(undefined)

    if (activeUser) {
      setActiveItem(activeUser)
      api.getUserMetrics(activeUser.id).then(setUserMetrics)
    } else if (recentProject) {
      setActiveItem(recentProject)
      api.getProjectMetrics(recentProject.id, recentProject.workspaceID).then(setProjectMetrics)
    } else if (workspace) {
      setActiveItem(workspace)
      api.getWorkspaceMetrics(workspace.id).then(setWorkspaceMetrics)
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
            {activeItem === ActiveUsersItem && (
              <ActiveUsers activeUsers={activeUsers} onFetchBefore={fetchActiveUsersBefore} onSelectUser={selectItem} />
            )}
            {activeItem === RecentProjectsItem && (
              <RecentProjects
                recentProjects={recentProjects}
                onSelectProject={selectItem}
                onSelectWorkspace={selectItem}
              />
            )}
            {userMetrics && activeItemIsUser(activeItem) && (
              <Suspense>
                <ActiveUserMetrics
                  user={activeItem}
                  metrics={userMetrics}
                  onDismiss={() => router.back()}
                  onSelectProject={selectItem}
                  onSelectWorkspace={selectItem}
                />
              </Suspense>
            )}
            {projectMetrics && activeItemIsProject(activeItem) && (
              <Suspense>
                <RecentProjectMetrics
                  project={activeItem}
                  projectMetrics={projectMetrics}
                  onSelectUser={selectItem}
                  onDismiss={() => router.back()}
                />
              </Suspense>
            )}
            {workspaceMetrics && (
              <Suspense>
                <WorkspaceMetrics
                  workspaceMetrics={workspaceMetrics}
                  onSelectUser={selectItem}
                  onSelectProject={selectItem}
                  onDismiss={() => router.back()}
                />
              </Suspense>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
