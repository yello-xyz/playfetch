import { Workspace } from '@/types'
import Label from '@/components/label'
import Icon from '../icon'
import folderIcon from '@/public/folder.svg'
import TableRow, { TableCell, TruncatedSpan } from './tableRow'

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
    <div className='flex flex-col items-start gap-4'>
      <Label>{title}</Label>
      <div className='items-center p-2 bg-white border border-gray-200 rounded-lg'>
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
    <TableRow onClick={() => onSelectWorkspace(workspace.id)}>
      <TableCell>
        <Icon icon={folderIcon} />
        <TruncatedSpan>{workspace.name}</TruncatedSpan>
      </TableCell>
    </TableRow>
  )
}
