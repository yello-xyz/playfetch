import { ProjectMetrics, RecentProject, WorkspaceMetrics } from '@/types'
import Label from '@/components/label'
import Icon from '../icon'
import backIcon from '@/public/back.svg'
import AnalyticsDashboards from '../endpoints/analyticsDashboards'
import { FormatDate } from '@/src/common/formatting'
import ActiveUsers from './activeUsers'
import fileIcon from '@/public/file.svg'
import folderIcon from '@/public/folder.svg'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { useState } from 'react'
import api from '@/src/client/admin/api'
import RecentProjects from './recentProjects'

export default function WorkspaceMetrics({
  metrics,
  onSelectUser,
  onSelectProject,
  onDismiss,
}: {
  metrics: WorkspaceMetrics
  onSelectUser: (userID: number) => void
  onSelectProject: (projectID: number) => void
  onDismiss: () => void
}) {
  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        <Label onClick={onDismiss} className='flex items-center cursor-pointer'>
          <Icon icon={backIcon} />
          Back to Workspaces
        </Label>
        <div className='flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg'>
          <div className='flex items-center'>
            <Icon icon={folderIcon} />
            <Label>
              {metrics.name}
            </Label>
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
