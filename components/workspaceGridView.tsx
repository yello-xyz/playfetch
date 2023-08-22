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
import { TopBarButton } from './topBarButton'
import addIcon from '@/public/addWhite.svg'

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
    <div className='flex flex-col h-full'>
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
        <>
          <div className='border-b border-gray-100 text-dark-gray-700 font-medium pt-1.5 pb-2.5 mx-5 mb-1'>
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
                onDeleted={onDeleted}
                workspaces={workspaces}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyWorkspaceView workspace={activeWorkspace} onAddProject={onAddProject} />
      )}
      {showInviteDialog && (
        <InviteDialog label='workspace' onConfirm={inviteMembers} onDismiss={() => setShowInviteDialog(false)} />
      )}
    </div>
  )
}

function EmptyWorkspaceView({ workspace, onAddProject }: { workspace: ActiveWorkspace; onAddProject: () => void }) {
  return (
    <div className='h-full px-6 pt-2 pb-6 text-dark-gray-700'>
      <div className='flex flex-col items-center justify-center h-full gap-3 p-6 border border-gray-200 rounded-lg bg-gray-25'>
        <div className='flex flex-col items-center max-w-md gap-0.5'>
          <span className='font-medium'>{workspace.name} is empty</span>
          <div className='text-sm text-center text-gray-400'>
            {workspace.name === 'Drafts' ? (
              <p>Projects created in drafts are private by default and can be shared later.</p>
            ) : (
              <>
                <p>Share your first project to invite collaborators to this workspace.</p>
                <p>Shared projects can be viewed and edited by workspace members.</p>
              </>
            )}
            <p>Get started by creating your first project in drafts.</p>
          </div>
        </div>
        <div>
          <TopBarButton type='primary' title='New Project' icon={addIcon} onClick={onAddProject} />
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
      className={`flex flex-col gap-1 px-3 py-4 rounded-lg cursor-pointer gap-6 w-full bg-gray-25 border border-gray-100 hover:bg-gray-50 hover:border-gray-200 select-none`}
      onClick={() => onSelectProject(project.id)}>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex flex-row gap-1.5 justify-center'>
          <IconButton
            hoverType={project.favorited ? 'none' : 'opacity'}
            icon={project.favorited ? filledStarIcon : starIcon}
            onClick={() => api.toggleFavoriteProject(project.id, !project.favorited).then(onRefreshWorkspace)}
          />
          <span className='flex-1 text-base font-medium text-dark-gray-700 line-clamp-2'>{project.name}</span>
        </div>
        <div className='relative flex items-center gap-2'>
          <span className='mr-5 text-xs text-dark-gray-700'>Edited {formattedDate}</span>
          <IconButton hoverType='opacity' icon={dotsIcon} onClick={() => setMenuExpanded(!isMenuExpanded)} />
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
