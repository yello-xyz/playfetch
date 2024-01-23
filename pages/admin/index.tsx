import { withAdminSession } from '@/src/server/session'
import { ActiveUser, ProjectMetrics, RecentProject, User, UserMetrics, Workspace, WorkspaceMetrics } from '@/types'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import ClientRoute, { ParseNumberQuery } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import { Suspense, useState } from 'react'
import api from '@/src/client/admin/api'
import { ActiveUsersItem, AdminItem, RecentProjectsItem, WaitlistItem } from '@/src/common/admin/adminItem'
import loadAdminItem from '@/src/server/admin/adminItem'

import dynamic from 'next/dynamic'
const MainAdminPane = dynamic(() => import('@/components/admin/mainAdminPane'))
const AdminSidebar = dynamic(() => import('@/components/admin/adminSidebar'))

export const getServerSideProps = withAdminSession(async ({ query }) => ({
  props: await loadAdminItem(query),
}))

export default function Admin({
  initialAdminItem,
  initialUserMetrics,
  initialProjectMetrics,
  initialWorkspaceMetrics,
  initialActiveUsers,
  recentProjects,
  waitlistUsers,
  analyticsLinks,
  debugLinks,
}: {
  initialAdminItem: AdminItem
  initialUserMetrics: UserMetrics | null
  initialProjectMetrics: ProjectMetrics | null
  initialWorkspaceMetrics: WorkspaceMetrics | null
  initialActiveUsers: ActiveUser[]
  waitlistUsers: User[]
  recentProjects: RecentProject[]
  analyticsLinks: [string, string]
  debugLinks: [string, string]
}) {
  const [adminItem, setAdminItem] = useState(initialAdminItem)
  const [userMetrics, setUserMetrics] = useState(initialUserMetrics)
  const [projectMetrics, setProjectMetrics] = useState(initialProjectMetrics)
  const [workspaceMetrics, setWorkspaceMetrics] = useState(initialWorkspaceMetrics)
  const [activeUsers, setActiveUsers] = useState(initialActiveUsers)

  const router = useRouter()

  const selectItem = (
    item: typeof WaitlistItem | typeof ActiveUsersItem | typeof RecentProjectsItem | number,
    isWorkspace = false
  ) => {
    router.push(
      `/admin${
        item === WaitlistItem
          ? '?w=1'
          : item === RecentProjectsItem
          ? '?p=1'
          : item !== ActiveUsersItem
          ? `?i=${item}`
          : ''
      }${isWorkspace ? '&s=1' : ''}`,
      undefined,
      {
        shallow: true,
      }
    )
  }

  const fetchActiveUsersBefore = () =>
    api.getActiveUsers(Math.min(...activeUsers.map(user => user.startTimestamp))).then(setActiveUsers)

  const { w: waitlist, p: projects, i: itemID, s: isWorkspace } = ParseNumberQuery(router.query)
  const currentQueryState = waitlist
    ? WaitlistItem
    : projects
    ? RecentProjectsItem
    : isWorkspace
    ? `${itemID}s`
    : itemID ?? ActiveUsersItem
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
      ...recentProjects.map(project => ({ id: project.workspaceID, name: project.workspace })),
    ]

    const activeUser = !isWorkspace ? knownUsers.find(user => user.id === itemID) : undefined
    const workspace = isWorkspace ? knownWorkspaces.find(workspace => workspace.id === itemID) : undefined
    const recentProject = knownProjects.find(project => project.id === itemID)

    setUserMetrics(null)
    setProjectMetrics(null)
    setWorkspaceMetrics(null)

    if (activeUser) {
      setAdminItem(activeUser)
      api.getUserMetrics(activeUser.id).then(setUserMetrics)
    } else if (recentProject) {
      setAdminItem(recentProject)
      api.getProjectMetrics(recentProject.id, recentProject.workspaceID).then(setProjectMetrics)
    } else if (workspace) {
      setAdminItem(workspace)
      api.getWorkspaceMetrics(workspace.id).then(setWorkspaceMetrics)
    } else {
      setAdminItem(waitlist ? WaitlistItem : projects ? RecentProjectsItem : ActiveUsersItem)
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
          <Suspense>
            <AdminSidebar
              onSelectWaitlist={() => selectItem(WaitlistItem)}
              onSelectActiveUsers={() => selectItem(ActiveUsersItem)}
              onSelectRecentProjects={() => selectItem(RecentProjectsItem)}
              analyticsLinks={analyticsLinks}
              debugLinks={debugLinks}
            />
          </Suspense>

          <Suspense>
            <MainAdminPane
              {...{
                adminItem,
                userMetrics,
                projectMetrics,
                workspaceMetrics,
                activeUsers,
                waitlistUsers,
                recentProjects,
                selectItem,
                fetchActiveUsersBefore,
              }}
            />
          </Suspense>
        </div>
      </main>
    </>
  )
}
