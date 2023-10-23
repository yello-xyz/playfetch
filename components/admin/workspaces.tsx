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
    <TableRow onClick={() => onSelectWorkspace(workspace.id)}>
      <TableCell>
        <Icon icon={folderIcon} />
        <TruncatedSpan>{workspace.name}</TruncatedSpan>
      </TableCell>
    </TableRow>
  )
}
