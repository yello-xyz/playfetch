import { ActiveWorkspace, Project, Workspace } from '@/types'
import { useState } from 'react'
import InviteDialog from './inviteDialog'
import api from '@/src/client/api'
import IconButton from './iconButton'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import { FormatRelativeDate } from '@/src/common/formatting'
import ProjectPopupMenu from './projectPopupMenu'
import WorkspaceTopBar from './workspaceTopBar'
import useFormattedDate from './useFormattedDate'

export default function WorkspaceGridView({
  workspaces,
  activeWorkspace,
  isUserWorkspace,
  isSharedProjects,
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
  onAddProject: () => void
  onSelectProject: (projectID: number) => void
  onSelectUserWorkspace: () => void
  onRefreshWorkspace: () => void
  onRefreshWorkspaces: () => void
}) {
  const [showInviteDialog, setShowInviteDialog] = useState(false)

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

  const onDeleted = isSharedProjects && activeWorkspace.projects.length === 1 ? resetWorkspaces : onRefreshWorkspace

  return (
    <>
      <div
        className={`${activeWorkspace.projects.length > 0 ? 'bg-gray-25' : 'bg-white'} flex flex-col h-full px-6 pb-0`}>
        <WorkspaceTopBar
          activeWorkspace={activeWorkspace}
          isUserWorkspace={isUserWorkspace}
          isSharedProjects={isSharedProjects}
          onAddProject={onAddProject}
          setShowInviteDialog={setShowInviteDialog}
          onRenamed={refresh}
          onDeleted={resetWorkspaces}
        />
        {activeWorkspace.projects.length > 0 ? (
          <div className='flex flex-col items-stretch h-full gap-3 overflow-y-auto'>
            {activeWorkspace.projects.map((project, index) => (
              <ProjectCell
                key={index}
                project={project}
                isSharedProjects={isSharedProjects}
                onSelectProject={onSelectProject}
                onRefreshWorkspace={onRefreshWorkspace}
                onDeleted={onDeleted}
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
    <div className='h-full pb-6 text-gray-700'>
      <div className='flex flex-col items-center justify-center h-full gap-1 p-6 border border-gray-200 rounded-lg bg-gray-25'>
        <span className='font-medium'>{workspace.name} is empty</span>
        <span className='text-sm text-center text-gray-400 '>
          Create a{' '}
          <span className='font-medium text-blue-400 cursor-pointer' onClick={onAddProject}>
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
  onDeleted,
}: {
  workspaces: Workspace[]
  project: Project
  isSharedProjects: boolean
  onSelectProject: (projectID: number) => void
  onRefreshWorkspace: () => void
  onDeleted: () => void
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const formattedDate = useFormattedDate(project.timestamp, FormatRelativeDate)

  return (
    <div
      className={`flex flex-col gap-1 p-4 border border-gray-200 rounded-lg cursor-pointer gap-6 w-full bg-white hover:bg-gray-50 hover:border-gray-300`}
      onClick={() => onSelectProject(project.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 text-base font-normal text-gray-700 line-clamp-2'>{project.name}</span>
        <div className='relative flex items-center gap-2'>
          <span className='mr-5 text-xs text-gray-400'>Edited {formattedDate}</span>
          <IconButton
            icon={project.favorited ? filledStarIcon : starIcon}
            onClick={() => api.toggleFavoriteProject(project.id, !project.favorited).then(onRefreshWorkspace)}
          />
          <IconButton icon={dotsIcon} onClick={() => setMenuExpanded(!isMenuExpanded)} />
          <div className='absolute right-0 top-7'>
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
