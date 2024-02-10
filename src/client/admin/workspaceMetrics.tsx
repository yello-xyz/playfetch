import { WorkspaceMetrics } from '@/types'
import Label from '@/src/client/components/label'
import Icon from '../components/icon'
import backIcon from '@/public/back.svg'
import ActiveUsers from './activeUsers'
import folderIcon from '@/public/folder.svg'
import { useState } from 'react'
import api from '@/src/client/admin/api'
import RecentProjects from './recentProjects'

export default function WorkspaceMetrics({
  workspaceMetrics,
  onSelectUser,
  onSelectProject,
  onDismiss,
}: {
  workspaceMetrics: WorkspaceMetrics
  onSelectUser: (userID: number) => void
  onSelectProject: (projectID: number) => void
  onDismiss: () => void
}) {
  const [metrics, setMetrics] = useState(workspaceMetrics)
  const firstActiveUserVersionTimestamp = Math.min(
    ...[...metrics.users, ...metrics.pendingUsers].map(user => user.startTimestamp)
  )

  const fetchWorkspaceMetricsWithActiveUsersBefore = () =>
    api.getWorkspaceMetrics(workspaceMetrics.id, firstActiveUserVersionTimestamp).then(setMetrics)

  return (
    <>
      <div className='flex flex-col items-start gap-4 p-6 overflow-y-auto'>
        <Label onClick={onDismiss} className='flex items-center cursor-pointer'>
          <Icon icon={backIcon} />
          Back to Workspaces
        </Label>
        <div className='flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg'>
          <div className='flex items-center'>
            <Icon icon={folderIcon} />
            <Label>{metrics.name}</Label>
          </div>
        </div>
        {metrics.projects.length > 0 && (
          <RecentProjects
            title='Workspace Projects'
            embedded
            recentProjects={metrics.projects}
            onSelectProject={onSelectProject}
          />
        )}
        <ActiveUsers
          title='Active Workspace Users'
          activeUsers={metrics.users}
          onFetchBefore={fetchWorkspaceMetricsWithActiveUsersBefore}
          onSelectUser={onSelectUser}
          embedded
        />
        {metrics.pendingUsers.length > 0 && (
          <ActiveUsers
            title='Pending Invitations'
            activeUsers={metrics.pendingUsers}
            onSelectUser={onSelectUser}
            embedded
          />
        )}
      </div>
    </>
  )
}
