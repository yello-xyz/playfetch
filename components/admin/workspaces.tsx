import { ReactNode } from 'react'
import { Workspace } from '@/types'
import Label from '@/components/label'
import Icon from '../icon'
import folderIcon from '@/public/folder.svg'

export default function Workspaces({
  title,
  workspaces,
  onSelectWorkspace,
}: {
  title: string
  workspaces: Workspace[]
  onSelectWorkspace: (workspaceID: number) => void
}) {
  return (
    <div className={`flex flex-col items-start h-full gap-4`}>
      <Label>{title}</Label>
      <div className={`bg-white items-center border-gray-200 border rounded-lg p-2`}>
        <TableCell>
          <Label>Workspace</Label>
        </TableCell>
        {workspaces.map(workspace => (
          <WorkspaceRow key={workspace.id} workspace={workspace} onSelectWorkspace={onSelectWorkspace} />
        ))}
      </div>
    </div>
  )
}

function WorkspaceRow({
  workspace,
  onSelectWorkspace,
}: {
  workspace: Workspace
  onSelectWorkspace: (workspaceID: number) => void
}) {
  return (
    <div className='cursor-pointer contents group' onClick={() => onSelectWorkspace(workspace.id)}>
      <TableCell>
        <Icon icon={folderIcon} />
        <TruncatedSpan>{workspace.name}</TruncatedSpan>
      </TableCell>
    </div>
  )
}

const TableCell = ({ children }: { children: ReactNode }) => (
  <div className='flex items-center h-10 px-2 overflow-hidden font-medium text-ellipsis group-hover:bg-gray-50'>
    {children}
  </div>
)

const TruncatedSpan = ({ children }: { children: ReactNode }) => (
  <span className='overflow-hidden whitespace-nowrap text-ellipsis'>{children}</span>
)
