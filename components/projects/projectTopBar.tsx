import { Workspace } from '@/types'
import { ReactNode, Suspense, useState } from 'react'
import Icon from '../icon'
import commentIcon from '@/public/commentBadge.svg'
import chevronIcon from '@/public/chevron.svg'
import api from '@/src/client/api'
import { TopBarButton } from '../topBarButton'
import { UserAvatars } from '@/components/users/userAvatars'
import TopBar, { TopBarAccessoryItem, TopBarBackItem } from '../topBar'

import dynamic from 'next/dynamic'
import InviteButton from '../users/inviteButton'
import { useActiveProject, useRefreshProject } from '@/src/client/context/projectContext'
const ProjectPopupMenu = dynamic(() => import('./projectPopupMenu'))

export default function ProjectTopBar({
  workspaces,
  onNavigateBack,
  showComments,
  setShowComments,
  children,
}: {
  workspaces: Workspace[]
  onNavigateBack: () => void
  showComments: boolean
  setShowComments: (show: boolean) => void
  children?: ReactNode
}) {
  const activeProject = useActiveProject()
  const refreshProject = useRefreshProject()
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const inviteMembers = async (emails: string[]) => {
    await api.inviteToProject(activeProject.id, emails)
    refreshProject()
  }

  const workspace = workspaces.find(workspace => workspace.id === activeProject.workspaceID)

  return (
    <>
      <TopBar>
        <TopBarBackItem title='Back to overview' onNavigateBack={onNavigateBack}>
          {children}
        </TopBarBackItem>
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
                  onRefresh={refreshProject}
                  onDeleted={onNavigateBack}
                />
              </Suspense>
            </div>
          </div>
        </div>
        <TopBarAccessoryItem className='flex items-center justify-end gap-2'>
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
