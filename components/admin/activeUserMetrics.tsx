import { ActiveUser, UserMetrics } from '@/types'
import Label from '@/components/label'
import UserAvatar from '@/components/users/userAvatar'
import { FormatCost, FormatDate } from '@/src/common/formatting'
import Icon from '../icon'
import backIcon from '@/public/back.svg'
import { LabelForProvider } from '@/src/common/providerMetadata'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import RecentProjects from './recentProjects'
import Workspaces from './workspaces'

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
            <Label>Total number of versions created: {metrics.versionTimestamps.length}</Label>
            <Label>Total number of comments made: {metrics.commentTimestamps.length}</Label>
            <Label>Total number of endpoints published: {metrics.endpointTimestamps.length}</Label>
          </div>
          <Label>Registered Providers:</Label>
          <div className='flex flex-col gap-1'>
            {metrics.providers.map((provider, index) => (
              <Label key={index}>
                • {LabelForProvider(provider.provider)} ({FormatCost(provider.cost)})
              </Label>
            ))}
          </div>
        </div>
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
