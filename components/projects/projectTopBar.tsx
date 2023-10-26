import { ActiveProject, Workspace } from '@/types'
import commentIcon from '@/public/commentBadge.svg'
import chevronIcon from '@/public/chevron.svg'
import { Suspense, useState } from 'react'
import Icon from '../icon'
import api from '@/src/client/api'
import { TopBarButton } from '../topBarButton'
import { UserAvatars } from '@/components/users/userAvatars'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '../topBar'

import dynamic from 'next/dynamic'
import InviteButton from '../users/inviteButton'
const ProjectPopupMenu = dynamic(() => import('./projectPopupMenu'))

export default function ProjectTopBar({
  workspaces,
  activeProject,
  onRefreshProject,
  onNavigateBack,
  showComments,
  setShowComments,
}: {
  workspaces: Workspace[]
  activeProject: ActiveProject
  onRefreshProject: () => void
  onNavigateBack: () => void
  showComments: boolean
  setShowComments: (show: boolean) => void
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const inviteMembers = async (emails: string[]) => {
    await api.inviteToProject(activeProject.id, emails)
    onRefreshProject()
  }

  const workspace = workspaces.find(workspace => workspace.id === activeProject.workspaceID)

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
            <div className='absolute right-0 shadow-sm top-8'>
              <Suspense>
                <ProjectPopupMenu
                  project={activeProject}
                  isMenuExpanded={isMenuExpanded}
                  setMenuExpanded={setMenuExpanded}
                  workspaces={workspaces}
                  isSharedProject={!workspace}
                  onRefresh={onRefreshProject}
                  onDeleted={onNavigateBack}
                />
              </Suspense>
            </div>
          </div>
        </div>
        <TopBarAccessoryItem className='flex items-center justify-end gap-4'>
          <UserAvatars users={activeProject.users} />
          <InviteButton
            users={activeProject.users}
            pendingUsers={activeProject.pendingUsers}
            onInvite={inviteMembers}
          />
          {activeProject.comments.length > 0 && (
            <TopBarButton icon={commentIcon} onClick={() => setShowComments(!showComments)} />
          )}
        </TopBarAccessoryItem>
      </TopBar>
    </>
  )
}
