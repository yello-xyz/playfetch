import { ActiveWorkspace, Project } from '@/types'
import { useState } from 'react'
import InviteDialog from './inviteDialog'
import api from '@/src/client/api'
import { TopBarButton, UserAvatars } from './topBar'
import addIcon from '@/public/add.svg'

export default function WorkspaceGridView({
  activeWorkspace,
  isSharedProjects,
  onAddProject,
  onSelectProject,
  onRefreshWorkspace,
}: {
  activeWorkspace: ActiveWorkspace
  isSharedProjects: boolean
  onAddProject: () => void
  onSelectProject: (projectID: number) => void
  onRefreshWorkspace: () => void
}) {
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const inviteMembers = async (emails: string[]) => {
    await api.inviteToWorkspace(activeWorkspace.id, emails)
    onRefreshWorkspace()
  }

  return (
    <>
      <div className='flex flex-col h-full px-6 pb-0 bg-gray-25'>
        <div className='flex items-center justify-between py-4'>
          <span className='text-base font-medium text-gray-800'>{activeWorkspace.name}</span>
          {!isSharedProjects && (
            <div className='flex items-center gap-2'>
              <UserAvatars users={activeWorkspace.users} />
              <TopBarButton title='Invite' onClick={() => setShowInviteDialog(true)} />
              <TopBarButton title='New Project' icon={addIcon} onClick={onAddProject} />
            </div>
          )}
        </div>
        {activeWorkspace.projects.length > 0 ? (
          <div className='flex flex-col items-stretch h-full gap-6 overflow-y-auto'>
            {activeWorkspace.projects.map((project, index) => (
              <ProjectCell key={index} project={project} onSelectProject={onSelectProject} />
            ))}
          </div>
        ) : (
          <EmptyWorkspaceView workspace={activeWorkspace} onAddProject={onAddProject} />
        )}
      </div>
      {showInviteDialog && (
        <InviteDialog label='workspace' onConfirm={inviteMembers} onDismiss={() => setShowInviteDialog(false)} />
      )}
    </>
  )
}

function EmptyWorkspaceView({ workspace, onAddProject }: { workspace: ActiveWorkspace; onAddProject: () => void }) {
  return (
    <div className='h-full pb-6'>
      <div className='flex flex-col items-center justify-center h-full gap-2 p-6 bg-gray-100 rounded-lg'>
        <span className='font-medium'>{workspace.name} is empty</span>
        <span className='text-xs text-center text-gray-400 '>
          Create a{' '}
          <span className='font-medium text-blue-500 cursor-pointer' onClick={onAddProject}>
            New Project
          </span>{' '}
          to get started.
        </span>
      </div>
    </div>
  )
}

function ProjectCell({ project, onSelectProject }: { project: Project; onSelectProject: (projectID: number) => void }) {
  return (
    <div
      className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer gap-6 w-full bg-white`}
      onClick={() => onSelectProject(project.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 text-base font-medium line-clamp-2'>{project.name}</span>
      </div>
    </div>
  )
}
