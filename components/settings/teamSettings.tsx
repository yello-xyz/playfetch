import { ActiveProject } from '@/types'
import MembersPane from '../users/membersPane'
import { useRefreshProject } from '@/src/client/context/refreshContext'
import api from '@/src/client/api'
import { useState } from 'react'
import ModalDialog, { DialogPrompt } from '../modalDialog'

export default function TeamSettings({ activeProject }: { activeProject: ActiveProject }) {
  const refreshProject = useRefreshProject()
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const inviteMembers = (emails: string[]) => api.inviteToProject(activeProject.id, emails).then(refreshProject)

  const revokeMemberAccess = (userID: number) =>
    setDialogPrompt({
      title: 'Are you sure you want to revoke project access for this member?',
      confirmTitle: 'Proceed',
      destructive: true,
      callback: () => api.revokeProjectAccess(activeProject.id, userID).then(refreshProject),
    })

  return (
    <div className='flex flex-col gap-3 p-3 bg-white border border-gray-200 rounded-lg'>
      <MembersPane
        owners={activeProject.projectOwners}
        members={activeProject.projectMembers}
        pendingMembers={activeProject.pendingProjectMembers}
        onInvite={inviteMembers}
        onRevoke={revokeMemberAccess}
      />
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </div>
  )
}
