import { ActiveWorkspace, IsPendingProject, PendingProject, Project, Workspace } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import IconButton from '@/src/client/components/iconButton'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import { FormatRelativeDate } from '@/src/common/formatting'
import ProjectPopupMenu from '@/src/client/projects/projectPopupMenu'
import WorkspaceTopBar, { AddProjectButton } from './workspaceTopBar'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import { InviteCell } from './inviteCell'

export default function WorkspaceGridView({
  workspaces,
  activeWorkspace,
  isUserWorkspace,
  isSharedProjects,
  showSettings,
  toggleSettings,
  onRespondToProjectInvite,
  onAddProject,
  onSelectProject,
  onSelectUserWorkspace,
  onRefreshWorkspace,
  onRefreshWorkspaces,
}: {
  workspaces: Workspace[]
  activeWorkspace: ActiveWorkspace
  isUserWorkspace: boolean
  isSharedProjects: boolean
  showSettings: boolean
  toggleSettings: (show: boolean) => void
  onRespondToProjectInvite: (projectID: number, accept: boolean) => void
  onAddProject: () => Promise<void>
  onSelectProject: (projectID: number) => void
  onSelectUserWorkspace: () => void
  onRefreshWorkspace: () => void
  onRefreshWorkspaces: () => void
}) {
  const inviteMembers = async (emails: string[]) => {
    await api.inviteToWorkspace(activeWorkspace.id, emails)
    onRefreshWorkspace()
  }

  const resetWorkspaces = () => {
    onSelectUserWorkspace()
    onRefreshWorkspaces()
  }

  const refresh = () => {
    onRefreshWorkspace()
    onRefreshWorkspaces()
  }

  return (
    <div className='flex flex-col h-full'>
      <WorkspaceTopBar
        activeWorkspace={activeWorkspace}
        isUserWorkspace={isUserWorkspace}
        isSharedProjects={isSharedProjects}
        onAddProject={onAddProject}
        onInviteMembers={inviteMembers}
        onRenamed={refresh}
        onShowSettings={() => toggleSettings(true)}
        onDeleted={resetWorkspaces}
      />
      {activeWorkspace.projects.length > 0 ? (
        <>
          <div className='border-b border-gray-100 text-gray-700 font-medium pt-1.5 pb-2.5 mx-5 mb-1'>
            <span>Project name</span>
          </div>
          <div className='flex flex-col overflow-y-auto h-full px-6 gap-3.5 pt-3.5 pb-5'>
            {activeWorkspace.projects.map((project, index) => (
              <ProjectCell
                key={index}
                project={project}
                isSharedProjects={isSharedProjects}
                onSelectProject={onSelectProject}
                onRefreshWorkspace={onRefreshWorkspace}
                onDeleted={onRefreshWorkspace}
                workspaces={workspaces}
                onRespondToInvite={accept => onRespondToProjectInvite(project.id, accept)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyWorkspaceView workspace={activeWorkspace} isUserWorkspace={isUserWorkspace} onAddProject={onAddProject} />
      )}
    </div>
  )
}

function EmptyWorkspaceView({
  workspace,
  isUserWorkspace,
  onAddProject,
}: {
  workspace: ActiveWorkspace
  isUserWorkspace: boolean
  onAddProject: () => Promise<void>
}) {
  return (
    <div className='h-full px-6 pt-2 pb-6 text-gray-700'>
      <div className='flex flex-col items-center justify-center h-full gap-3 p-6 border border-gray-200 rounded-lg bg-gray-25'>
        <div className='flex flex-col items-center max-w-sm gap-0.5'>
          <span className='font-medium'>{workspace.name} is empty</span>
          <div className='text-sm text-center text-gray-400'>
            {isUserWorkspace ? (
              <p>
                Draft projects are private by default but can be shared later. Get started by creating your first
                project.
              </p>
            ) : (
              <p>
                A workspace is a collection of projects. All workspace members can access the projects that are part of
                this workspace.
              </p>
            )}
          </div>
        </div>
        <div>
          <AddProjectButton onAddProject={onAddProject} />
        </div>
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
  onDeleted,
  onRespondToInvite,
}: {
  workspaces: Workspace[]
  project: Project | PendingProject
  isSharedProjects: boolean
  onSelectProject: (projectID: number) => void
  onRefreshWorkspace: () => void
  onDeleted: () => void
  onRespondToInvite: (accept: boolean) => void
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const formattedDate = useFormattedDate(project.timestamp, FormatRelativeDate)

  return IsPendingProject(project) ? (
    <InviteCell item={project} label='project' onRespond={onRespondToInvite} />
  ) : (
    <div
      className='flex flex-col w-full gap-6 p-4 border border-gray-200 rounded-lg cursor-pointer select-none bg-gray-25 hover:bg-gray-50 hover:border-gray-200'
      onClick={() => onSelectProject(project.id)}>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex gap-1.5 justify-center'>
          <IconButton
            hoverType={project.favorited ? 'none' : 'opacity'}
            icon={project.favorited ? filledStarIcon : starIcon}
            onClick={() => api.toggleFavoriteProject(project.id, !project.favorited).then(onRefreshWorkspace)}
          />
          <span className='flex-1 text-base font-medium text-gray-700 line-clamp-2'>{project.name}</span>
        </div>
        <div className='relative flex items-center gap-2'>
          <span className='mr-5 text-xs text-gray-700'>Edited {formattedDate}</span>
          <IconButton hoverType='opacity' icon={dotsIcon} onClick={() => setMenuExpanded(!isMenuExpanded)} />
          <div className='absolute right-0 shadow-sm top-7'>
            <ProjectPopupMenu
              project={project}
              isMenuExpanded={isMenuExpanded}
              setMenuExpanded={setMenuExpanded}
              workspaces={workspaces}
              isSharedProject={isSharedProjects}
              onRefresh={onRefreshWorkspace}
              onDeleted={onDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
