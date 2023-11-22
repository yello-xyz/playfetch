import { ActiveProject } from '@/types'
import MembersPane from '../users/membersPane'
import { useRefreshProject } from '@/src/client/context/refreshContext'
import api from '@/src/client/api'

export default function TeamSettings({ activeProject }: { activeProject: ActiveProject }) {
  const refreshProject = useRefreshProject()

  const inviteMembers = (emails: string[]) => api.inviteToProject(activeProject.id, emails).then(refreshProject)

  return (
    <div className='flex flex-col gap-3 p-3 bg-white border border-gray-200 rounded-lg'>
      <MembersPane
        users={[...activeProject.projectOwners, ...activeProject.projectMembers]}
        pendingUsers={activeProject.pendingProjectMembers}
        onInvite={inviteMembers}
      />
    </div>
  )
}
