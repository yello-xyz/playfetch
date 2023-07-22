import { ActiveChain, ActiveProject, ActivePrompt } from '@/types'
import projectIcon from '@/public/project.svg'
import commentIcon from '@/public/commentBadge.svg'
import chevronIcon from '@/public/chevron.svg'
import { useState } from 'react'
import ProjectPopupMenu from './projectPopupMenu'
import Icon from './icon'
import ProjectItemPopupMenu from './projectItemPopupMenu'
import api from '@/src/client/api'
import InviteDialog from './inviteDialog'
import { TopBarButton, UserAvatars } from './topBarButton'
import backIcon from '@/public/back.svg'

export default function ProjectTopBar({
  activeProject,
  activeItem,
  onRefreshItem,
  onDeleteItem,
  onRefreshProject,
  onNavigateBack,
  showComments,
  setShowComments,
}: {
  activeProject: ActiveProject
  activeItem?: ActivePrompt | ActiveChain
  onRefreshItem: () => void
  onDeleteItem: () => void
  onRefreshProject: () => void
  onNavigateBack: () => void
  showComments: boolean
  setShowComments: (show: boolean) => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const inviteMembers = async (emails: string[]) => {
    await api.inviteToProject(activeProject.id, emails)
    onRefreshProject()
  }

  const promptHasComments =
    activeItem && 'versions' in activeItem && (activeItem?.versions ?? []).some(version => version.comments.length > 0)

  return (
    <>
      <div className='z-10 flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200'>
        <div className='flex items-center gap-1 py-1 cursor-pointer' onClick={onNavigateBack}>
          <Icon icon={backIcon} />
          Back to overview
        </div>
        <div className='relative flex gap-1 text-base justify-self-start'>
          <Icon icon={projectIcon} />
          {activeItem && (
            <>
              <span className='cursor-pointer'>{activeProject.name}</span>
              <span className='font-medium'>{' / '}</span>
            </>
          )}
          <div className='relative flex cursor-pointer' onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
            <span className='font-medium'>{activeItem?.name ?? activeProject.name}</span>
            <Icon icon={chevronIcon} />
            <div className='absolute right-0 top-8'>
              {activeItem ? (
                <ProjectItemPopupMenu
                  item={activeItem}
                  isMenuExpanded={isMenuExpanded}
                  setIsMenuExpanded={setIsMenuExpanded}
                  onRefresh={onRefreshItem}
                  onDelete={onDeleteItem}
                />
              ) : (
                <ProjectPopupMenu
                  project={activeProject}
                  isMenuExpanded={isMenuExpanded}
                  setIsMenuExpanded={setIsMenuExpanded}
                  canLeave={activeProject.users.length > 1}
                  canDelete={activeProject.users.length === 1}
                  onRefresh={onRefreshProject}
                  onDeleteOrLeave={onNavigateBack}
                />
              )}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-4'>
          <UserAvatars users={activeProject.users} />
          <TopBarButton title='Invite' onClick={() => setShowInviteDialog(true)} />
          {promptHasComments && <TopBarButton icon={commentIcon} onClick={() => setShowComments(!showComments)} />}
        </div>
      </div>
      {showInviteDialog && (
        <InviteDialog label='project' onConfirm={inviteMembers} onDismiss={() => setShowInviteDialog(false)} />
      )}
    </>
  )
}
