import MembersPane from '@/src/client/users/membersPane'
import api from '@/src/client/api'
import { useState } from 'react'
import ModalDialog, { DialogPrompt } from '@/src/client/components/modalDialog'
import { ActiveProject, ActiveWorkspace } from '@/types'

export default function TeamSettings({
  activeItem,
  refreshItem,
}: {
  activeItem: ActiveWorkspace | ActiveProject
  refreshItem: () => void
}) {
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const itemIsWorkspace = (item: ActiveWorkspace | ActiveProject): item is ActiveWorkspace => 'projects' in item
  const isWorkspace = itemIsWorkspace(activeItem)

  const inviteMembers = (emails: string[]) =>
    isWorkspace
      ? api.inviteToProject(activeItem.id, emails).then(refreshItem) // TODO implement inviteToWorkspace
      : api.inviteToProject(activeItem.id, emails).then(refreshItem)

  const revokeMemberAccess = (userID: number) =>
    setDialogPrompt({
      title: `Are you sure you want to revoke ${isWorkspace ? 'workspace' : 'project'} access for this member?`,
      confirmTitle: 'Proceed',
      destructive: true,
      callback: () =>
        isWorkspace
          ? api.revokeProjectAccess(activeItem.id, userID).then(refreshItem) // TODO implement revokeWorkspaceAccess
          : api.revokeProjectAccess(activeItem.id, userID).then(refreshItem),
    })

  const toggleOwnership = (userID: number, isOwner: boolean) =>
    isWorkspace
      ? api.toggleProjectOwnership(activeItem.id, userID, isOwner).then(refreshItem) // TODO toggleWorkspaceOwnership
      : api.toggleProjectOwnership(activeItem.id, userID, isOwner).then(refreshItem)

  const owners = isWorkspace ? activeItem.owners : activeItem.projectOwners
  const members = isWorkspace
    ? activeItem.users.filter(u => !owners.some(o => o.id === u.id))
    : activeItem.projectMembers
  const pendingMembers = isWorkspace ? activeItem.pendingUsers : activeItem.pendingProjectMembers
  const explicitMemberIDs = new Set([...owners, ...members].map(user => user.id))
  const implicitMembers = activeItem.users.filter(user => !explicitMemberIDs.has(user.id))

  return (
    <div className='flex flex-col gap-3 p-3 bg-white border border-gray-200 rounded-lg'>
      <MembersPane
        owners={owners}
        members={members}
        implicitMembers={implicitMembers}
        pendingMembers={pendingMembers}
        onInvite={inviteMembers}
        onRevoke={revokeMemberAccess}
        onToggleOwnership={toggleOwnership}
      />
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </div>
  )
}
