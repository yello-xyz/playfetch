import { PendingWorkspace } from '@/types'
import WorkspaceTopBar from './workspaceTopBar'
import { InviteCell } from './inviteCell'

export default function WorkspaceInvite({
  workspace,
  onRespond,
}: {
  workspace: PendingWorkspace
  onRespond: (accept: boolean) => void
}) {
  return (
    <div className='flex flex-col h-full'>
      <WorkspaceTopBar activeWorkspace={workspace} />
      <div className='p-6'>
        <InviteCell item={workspace} label='workspace' onRespond={onRespond} />
      </div>
    </div>
  )
}
