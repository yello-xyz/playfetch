import { withAdminSession } from '@/src/server/session'
import { ActiveUser, ProjectMetrics, RecentProject, User, UserMetrics, Workspace, WorkspaceMetrics } from '@/types'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '@/components/topBar'
import AdminSidebar from '@/components/admin/adminSidebar'
import Waitlist from '@/components/admin/waitlist'
import ClientRoute, { ParseNumberQuery } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import { Suspense, useState } from 'react'
import ActiveUsers from '@/components/admin/activeUsers'
import api from '@/src/client/admin/api'
import RecentProjects from '@/components/admin/recentProjects'
import {
  ActiveUsersItem,
  AdminItem,
  AdminItemIsProject,
  AdminItemIsUser,
  RecentProjectsItem,
  WaitlistItem,
} from '@/src/common/admin/adminItem'
import loadAdminItem from '@/src/server/admin/adminItem'

import dynamic from 'next/dynamic'
const ActiveUserMetrics = dynamic(() => import('@/components/admin/activeUserMetrics'))
const RecentProjectMetrics = dynamic(() => import('@/components/admin/recentProjectMetrics'))
const WorkspaceMetrics = dynamic(() => import('@/components/admin/workspaceMetrics'))

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
      ...recentProjects.map(project => ({ id: project.workspaceID, name: project.workspaceName })),
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
          <AdminSidebar
            onSelectWaitlist={() => selectItem(WaitlistItem)}
            onSelectActiveUsers={() => selectItem(ActiveUsersItem)}
            onSelectRecentProjects={() => selectItem(RecentProjectsItem)}
            analyticsLinks={analyticsLinks}
            debugLinks={debugLinks}
          />
          <div className='flex flex-col flex-1 bg-gray-25'>
            {adminItem === WaitlistItem && <Waitlist initialWaitlistUsers={waitlistUsers} />}
            {adminItem === ActiveUsersItem && (
              <ActiveUsers activeUsers={activeUsers} onFetchBefore={fetchActiveUsersBefore} onSelectUser={selectItem} />
            )}
            {adminItem === RecentProjectsItem && (
              <RecentProjects
                recentProjects={recentProjects}
                onSelectProject={selectItem}
                onSelectWorkspace={workspaceID => selectItem(workspaceID, true)}
              />
            )}
            {userMetrics && AdminItemIsUser(adminItem) && (
              <Suspense>
                <ActiveUserMetrics
                  user={adminItem}
                  metrics={userMetrics}
                  onDismiss={() => router.back()}
                  onSelectProject={selectItem}
                  onSelectWorkspace={workspaceID => selectItem(workspaceID, true)}
                />
              </Suspense>
            )}
            {projectMetrics && AdminItemIsProject(adminItem) && (
              <Suspense>
                <RecentProjectMetrics
                  project={adminItem}
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
