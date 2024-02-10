import { ActiveUser, UserMetrics } from '@/types'
import Label from '@/src/client/components/label'
import UserAvatar from '@/src/client/users/userAvatar'
import { FormatCost, FormatDate } from '@/src/common/formatting'
import Icon from '../components/icon'
import backIcon from '@/public/back.svg'
import { LabelForProvider } from '@/src/common/providerMetadata'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import RecentProjects from './recentProjects'
import Workspaces from './workspaces'
import DashboardContainer from '../endpoints/dashboardContainer'
import { Legend, Line, LineChart, Tooltip, XAxis } from 'recharts'
import { Suspense } from 'react'

export default function ActiveUserMetrics({
  user,
  metrics,
  onSelectProject,
  onSelectWorkspace,
  onDismiss,
}: {
  user: ActiveUser
  metrics: UserMetrics
  onSelectProject: (projectID: number) => void
  onSelectWorkspace: (workspaceID: number) => void
  onDismiss: () => void
}) {
  const lastActive = useFormattedDate(user.lastActive, timestamp => FormatDate(timestamp, true, true))

  const activityData = metrics.activity.map(({ timestamp, versions, runs, comments, endpoints }) => ({
    date: FormatDate(timestamp, false, true),
    versions,
    runs,
    comments,
    endpoints,
  }))
  const versionCount = activityData.reduce((acc, activity) => acc + activity.versions, 0)
  const runCount = activityData.reduce((acc, activity) => acc + activity.runs, 0)
  const commentCount = activityData.reduce((acc, activity) => acc + activity.comments, 0)
  const endpointCount = activityData.reduce((acc, activity) => acc + activity.endpoints, 0)

  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        <Label onClick={onDismiss} className='flex items-center cursor-pointer'>
          <Icon icon={backIcon} />
          Back to Active Users
        </Label>
        <div className='flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg'>
          <div className='flex items-center gap-2'>
            <UserAvatar user={user} />
            <Label>
              {user.fullName} ({user.email})
            </Label>
          </div>
          <Label>Last Active: {lastActive}</Label>
          <div className='flex flex-col gap-1'>
            <Label>Number of additional workspaces created: {metrics.createdWorkspaceCount - 1}</Label>
            <Label>
              Number of additional workspaces shared with user:{' '}
              {metrics.workspaceAccessCount - metrics.createdWorkspaceCount}
            </Label>
            <Label>Number of additional projects shared with user: {metrics.projectAccessCount}</Label>
          </div>
          <div className='flex flex-col gap-1'>
            <Label>Total number of versions created: {versionCount}</Label>
            <Label>Total number of runs executed: {runCount}</Label>
            <Label>Total number of comments made: {commentCount}</Label>
            <Label>Total number of endpoints published: {endpointCount}</Label>
          </div>
          <Label>Registered Providers:</Label>
          <div className='flex flex-col gap-1'>
            {metrics.providers.map((provider, index) => (
              <Label key={index}>• {LabelForProvider(provider)}</Label>
            ))}
          </div>
        </div>
        {activityData.length > 0 && (
          <Suspense>
            <div className='w-full'>
              <DashboardContainer title='User Activity' range={activityData.length}>
                <LineChart id='requests' data={activityData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <Line type='bump' dot={false} strokeWidth={1} dataKey='versions' stroke='#E14BD2' />
                  <Line type='bump' dot={false} strokeWidth={1} dataKey='runs' stroke='#7D48EF' />
                  <Line type='bump' dot={false} strokeWidth={1} dataKey='comments' stroke='#3B8CEB' />
                  <Line type='bump' dot={false} strokeWidth={1} dataKey='endpoints' stroke='#F2A93C' />
                  <Tooltip />
                  <Legend />
                  <XAxis dataKey='date' hide />
                </LineChart>
              </DashboardContainer>
            </div>
          </Suspense>
        )}
        <Workspaces title='Workspaces' workspaces={metrics.workspaces} onSelectWorkspace={onSelectWorkspace} />
        {metrics.pendingWorkspaces.length > 0 && (
          <Workspaces
            title='Pending Workspace Invitations'
            workspaces={metrics.pendingWorkspaces}
            onSelectWorkspace={() => {}}
          />
        )}
        {metrics.sharedProjects.length > 0 && (
          <RecentProjects
            title='Shared Projects'
            embedded
            recentProjects={metrics.sharedProjects}
            onSelectProject={onSelectProject}
            onSelectWorkspace={onSelectWorkspace}
          />
        )}
        {metrics.pendingSharedProjects.length > 0 && (
          <RecentProjects
            title='Pending Project Invitations'
            embedded
            recentProjects={metrics.pendingSharedProjects}
            onSelectProject={onSelectProject}
            onSelectWorkspace={onSelectWorkspace}
          />
        )}
      </div>
    </>
  )
}
