import { ActiveProject, ActivePrompt, Chain, Workspace } from '@/types'
import commentIcon from '@/public/commentBadge.svg'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import ProjectPopupMenu from './projectPopupMenu'
import Icon from '../icon'
import api from '@/src/client/api'
import InviteDialog from '../inviteDialog'
import { TopBarButton, UserAvatars } from '../topBarButton'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '../topBar'

export default function ProjectTopBar({
  workspaces,
  activeProject,
  activeItem,
  onRefreshProject,
  onNavigateBack,
  showComments,
  setShowComments,
}: {
  workspaces: Workspace[]
  activeProject: ActiveProject
  activeItem?: ActivePrompt | Chain
  onRefreshProject: () => void
  onNavigateBack: () => void
  showComments: boolean
  setShowComments: (show: boolean) => void
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const inviteMembers = async (emails: string[]) => {
    await api.inviteToProject(activeProject.id, emails)
    onRefreshProject()
  }

  const workspace = workspaces.find(workspace => workspace.id === activeProject.workspaceID)

  const promptHasComments =
    activeItem && 'versions' in activeItem && (activeItem?.versions ?? []).some(version => version.comments.length > 0)

  return (
    <>
      <TopBar>
        <TopBarBackItem title='Back to overview' onNavigateBack={onNavigateBack} />
        <div className='relative flex gap-1 text-base justify-self-start'>
          {workspace && (
            <span>
              {workspace.name}
              <span className='font-medium'>{' / '}</span>
            </span>
          )}
          <div className='relative flex cursor-pointer' onClick={() => setMenuExpanded(!isMenuExpanded)}>
            <span className='font-medium'>{activeProject.name}</span>
            <Icon icon={chevronIcon} />
            <div className='absolute right-0 top-8 shadow-sm'>
              <ProjectPopupMenu
                project={activeProject}
                isMenuExpanded={isMenuExpanded}
                setMenuExpanded={setMenuExpanded}
                workspaces={workspaces}
                isSharedProject={!workspace}
                onRefresh={onRefreshProject}
                onDeleted={onNavigateBack}
              />
            </div>
          </div>
        </div>
        <TopBarAccessoryItem className='flex items-center justify-end gap-4'>
          <UserAvatars users={activeProject.users} />
          <TopBarButton title='Invite' onClick={() => setShowInviteDialog(true)} />
          {promptHasComments && <TopBarButton icon={commentIcon} onClick={() => setShowComments(!showComments)} />}
        </TopBarAccessoryItem>
      </TopBar>
      {showInviteDialog && (
        <InviteDialog label='project' onConfirm={inviteMembers} onDismiss={() => setShowInviteDialog(false)} />
      )}
    </>
  )
}