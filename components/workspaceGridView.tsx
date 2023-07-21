import { ActiveWorkspace, Project, Workspace } from '@/types'
import { useEffect, useState } from 'react'
import InviteDialog from './inviteDialog'
import api from '@/src/client/api'
import { TopBarButton, UserAvatars } from './topBar'
import addIcon from '@/public/add.svg'
import IconButton from './iconButton'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import { FormatRelativeDate } from '@/src/common/formatting'
import ProjectPopupMenu from './projectPopupMenu'

export default function WorkspaceGridView({
  workspaces,
  activeWorkspace,
  isSharedProjects,
  onAddProject,
  onSelectProject,
  onRefreshWorkspace,
  onLeftLastSharedProject,
}: {
  workspaces: Workspace[]
  activeWorkspace: ActiveWorkspace
  isSharedProjects: boolean
  onAddProject: () => void
  onSelectProject: (projectID: number) => void
  onRefreshWorkspace: () => void
  onLeftLastSharedProject: () => void
}) {
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const inviteMembers = async (emails: string[]) => {
    await api.inviteToWorkspace(activeWorkspace.id, emails)
    onRefreshWorkspace()
  }

  const onDeleteOrLeave =
    isSharedProjects && activeWorkspace.projects.length === 1 ? onLeftLastSharedProject : onRefreshWorkspace

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
              <ProjectCell
                key={index}
                project={project}
                isSharedProjects={isSharedProjects}
                onSelectProject={onSelectProject}
                onRefreshWorkspace={onRefreshWorkspace}
                onDeleteOrLeave={onDeleteOrLeave}
                workspaces={workspaces}
              />
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

function ProjectCell({
  workspaces,
  project,
  isSharedProjects,
  onSelectProject,
  onRefreshWorkspace,
  onDeleteOrLeave,
}: {
  workspaces: Workspace[]
  project: Project
  isSharedProjects: boolean
  onSelectProject: (projectID: number) => void
  onRefreshWorkspace: () => void
  onDeleteOrLeave: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const [formattedDate, setFormattedDate] = useState<string>()
  useEffect(() => {
    setFormattedDate(FormatRelativeDate(project.timestamp))
  }, [project.timestamp])

  return (
    <div
      className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer gap-6 w-full bg-white`}
      onClick={() => onSelectProject(project.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 text-base font-medium line-clamp-2'>{project.name}</span>
        <div className='relative flex items-center gap-2'>
          <span className='mr-5 text-xs text-gray-500'>Edited {formattedDate}</span>
          <IconButton
            icon={project.favorited ? filledStarIcon : starIcon}
            onClick={() => api.toggleFavoriteProject(project.id, !project.favorited).then(onRefreshWorkspace)}
          />
          <IconButton icon={dotsIcon} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
          <div className='absolute right-0 top-7'>
            <ProjectPopupMenu
              project={project}
              isMenuExpanded={isMenuExpanded}
              setIsMenuExpanded={setIsMenuExpanded}
              workspaces={workspaces}
              canLeave={isSharedProjects}
              canDelete={!isSharedProjects}
              onRefresh={onRefreshWorkspace}
              onDeleteOrLeave={onDeleteOrLeave}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
