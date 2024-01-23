import { ActiveUser, ProjectMetrics, RecentProject, User, UserMetrics, WorkspaceMetrics } from '@/types'
import Waitlist from '@/components/admin/waitlist'
import { useRouter } from 'next/router'
import ActiveUsers from '@/components/admin/activeUsers'
import RecentProjects from '@/components/admin/recentProjects'
import {
  ActiveUsersItem,
  AdminItem,
  AdminItemIsProject,
  AdminItemIsUser,
  RecentProjectsItem,
  WaitlistItem,
} from '@/src/common/admin/adminItem'
import ActiveUserMetrics from '@/components/admin/activeUserMetrics'
import RecentProjectMetrics from './recentProjectMetrics'
import RecentWorkspaceMetrics from './workspaceMetrics'

export default function MainAdminPane({
  adminItem,
  userMetrics,
  projectMetrics,
  workspaceMetrics,
  activeUsers,
  recentProjects,
  waitlistUsers,
  selectItem,
  fetchActiveUsersBefore,
}: {
  adminItem: AdminItem
  userMetrics: UserMetrics | null
  projectMetrics: ProjectMetrics | null
  workspaceMetrics: WorkspaceMetrics | null
  activeUsers: ActiveUser[]
  waitlistUsers: User[]
  recentProjects: RecentProject[]
  selectItem: (
    item: typeof WaitlistItem | typeof ActiveUsersItem | typeof RecentProjectsItem | number,
    isWorkspace?: boolean
  ) => void
  fetchActiveUsersBefore: () => Promise<void>
}) {
  const router = useRouter()

  return (
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
        <ActiveUserMetrics
          user={adminItem}
          metrics={userMetrics}
          onDismiss={() => router.back()}
          onSelectProject={selectItem}
          onSelectWorkspace={workspaceID => selectItem(workspaceID, true)}
        />
      )}
      {projectMetrics && AdminItemIsProject(adminItem) && (
        <RecentProjectMetrics
          project={adminItem}
          projectMetrics={projectMetrics}
          onSelectUser={selectItem}
          onDismiss={() => router.back()}
        />
      )}
      {workspaceMetrics && (
        <RecentWorkspaceMetrics
          workspaceMetrics={workspaceMetrics}
          onSelectUser={selectItem}
          onSelectProject={selectItem}
          onDismiss={() => router.back()}
        />
      )}
    </div>
  )
}
