import { ProjectMetrics, RecentProject } from '@/types'
import Label from '@/components/label'
import Icon from '../icon'
import backIcon from '@/public/back.svg'
import AnalyticsDashboards from '../endpoints/analyticsDashboards'
import { FormatDate } from '@/src/common/formatting'
import ActiveUsers from './activeUsers'
import fileIcon from '@/public/file.svg'
import folderIcon from '@/public/folder.svg'

export default function RecentProjectMetrics({
  project,
  metrics,
  onSelectUser,
  onDismiss,
}: {
  project: RecentProject
  metrics: ProjectMetrics
  onSelectUser: (userID: number) => void
  onDismiss: () => void
}) {
  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        <Label onClick={onDismiss} className='flex items-center cursor-pointer'>
          <Icon icon={backIcon} />
          Back to Active Projects
        </Label>
        <div className='flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg'>
          <div className='flex items-center'>
            <Icon icon={fileIcon} />
            <Label>{project.name} • </Label>
            <Icon icon={folderIcon} />
            <Label>
              {project.workspace} ({project.creator})
            </Label>
          </div>
          <Label>Last Modified: {FormatDate(project.timestamp, true, true)}</Label>
          <div className='flex flex-col gap-1'>
            <Label>Number of prompts: {metrics.promptCount}</Label>
            <Label>Number of chains: {metrics.chainCount}</Label>
            <Label>Number of endpoints: {metrics.endpointCount}</Label>
          </div>
        </div>
        <div className='w-full '>
          <AnalyticsDashboards analytics={metrics.analytics} />
        </div>
        <ActiveUsers activeUsers={metrics.users} onSelectUser={onSelectUser} embedded />
      </div>
    </>
  )
}