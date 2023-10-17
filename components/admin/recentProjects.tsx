import { ReactNode } from 'react'
import { RecentProject } from '@/types'
import Label from '@/components/label'
import { FormatDate } from '@/src/common/formatting'
import Icon from '../icon'
import fileIcon from '@/public/file.svg'
import folderIcon from '@/public/folder.svg'
import userIcon from '@/public/user.svg'

export default function RecentProjects({
  recentProjects,
  onSelectProject,
}: {
  recentProjects: RecentProject[]
  onSelectProject: (projectID: number) => void
}) {
  const gridConfig = 'grid grid-cols-[100px_minmax(0,1fr)_200px_200px]'

  const startDate = Math.min(...recentProjects.map(project => project.timestamp))

  return (
    <>
      <div className='flex flex-col items-start h-full gap-4 p-6 overflow-y-auto'>
        {recentProjects.length > 0 && (
          <>
            <Label>Active Projects (data since {FormatDate(startDate)})</Label>
            <div className={`${gridConfig} bg-white items-center border-gray-200 border rounded-lg`}>
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
                <div
                  key={project.id}
                  className='cursor-pointer contents group'
                  onClick={() => onSelectProject(project.id)}>
                  <TableCell>{FormatDate(project.timestamp, false)}</TableCell>
                  <TableCell>
                    <Icon icon={fileIcon} />
                    {project.name}
                  </TableCell>
                  <TableCell>
                    <Icon icon={folderIcon} />
                    {project.workspace}
                  </TableCell>
                  <TableCell>
                    <Icon icon={userIcon} />
                    {project.creator}
                  </TableCell>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

const TableCell = ({ children }: { children: ReactNode }) => (
  <div className='flex items-center h-10 px-2 overflow-hidden font-medium text-ellipsis group-hover:bg-gray-50'>
    {children}
  </div>
)