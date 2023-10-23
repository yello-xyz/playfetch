import { RecentProject } from '@/types'
import Label from '@/components/label'
import { FormatDate } from '@/src/common/formatting'
import Icon from '../icon'
import fileIcon from '@/public/file.svg'
import folderIcon from '@/public/folder.svg'
import userIcon from '@/public/user.svg'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import TableRow, { TableCell, TruncatedSpan } from './tableRow'

export default function RecentProjects({
  title = 'Active Projects',
  recentProjects,
  onSelectProject,
  embedded,
}: {
  title?: string
  recentProjects: RecentProject[]
  onSelectProject: (projectID: number) => void
  embedded?: boolean
}) {
  const gridConfig = 'grid grid-cols-[100px_minmax(0,1fr)_200px_200px]'

  const startDate = useFormattedDate(Math.min(...recentProjects.map(project => project.timestamp)))

  return (
    <>
      <div className={`flex flex-col items-start h-full gap-4 ${embedded ? '' : 'p-6 overflow-y-auto'}`}>
        {recentProjects.length > 0 && (
          <>
            <Label>{title}{!embedded && ` (data since ${startDate})`}</Label>
            <div className={`${gridConfig} bg-white items-center border-gray-200 border rounded-lg p-2`}>
              <TableCell>
                <Label>Last Edited</Label>
              </TableCell>
              <TableCell>
                <Label>Project</Label>
              </TableCell>
              <TableCell>
                <Label>Workspace</Label>
              </TableCell>
              <TableCell>
                <Label>Workspace Creator</Label>
              </TableCell>
              {recentProjects.map(project => (
                <ProjectRow key={project.id} project={project} onSelectProject={onSelectProject} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ProjectRow({
  project,
  onSelectProject,
}: {
  project: RecentProject
  onSelectProject: (projectID: number) => void
}) {
  const lastModified = useFormattedDate(project.timestamp, timestamp => FormatDate(timestamp, false))

  return (
    <TableRow onClick={() => onSelectProject(project.id)}>
      <TableCell>{lastModified}</TableCell>
      <TableCell>
        <Icon icon={fileIcon} />
        <TruncatedSpan>{project.name}</TruncatedSpan>
      </TableCell>
      <TableCell>
        <Icon icon={folderIcon} />
        <TruncatedSpan>{project.workspace}</TruncatedSpan>
      </TableCell>
      <TableCell>
        <Icon icon={userIcon} />
        <TruncatedSpan>{project.creator}</TruncatedSpan>
      </TableCell>
    </TableRow>
  )
}
