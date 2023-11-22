import { ActiveWorkspace, Workspace } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import folderIcon from '@/public/folder.svg'
import fileIcon from '@/public/file.svg'
import addIcon from '@/public/add.svg'
import UserSidebarItem from '../users/userSidebarItem'
import PickNameDialog from '../pickNameDialog'
import { useLoggedInUser } from '@/src/client/context/userContext'
import { FeedbackSection, SidebarButton, SidebarSection } from '../sidebar'

export default function WorkspaceSidebar({
  workspaces,
  pendingWorkspaces,
  activeWorkspaceID,
  sharedProjects,
  onSelectWorkspace,
  onSelectSharedProjects,
  onRefreshWorkspaces,
}: {
  workspaces: Workspace[]
  pendingWorkspaces: Workspace[]
  activeWorkspaceID: number
  sharedProjects?: ActiveWorkspace
  onSelectWorkspace: (workspaceID: number) => void
  onSelectSharedProjects?: () => void
  onRefreshWorkspaces: () => Promise<void>
}) {
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const addWorkspace = async (name: string) => {
    const workspaceID = await api.addWorkspace(name)
    onRefreshWorkspaces().then(() => onSelectWorkspace(workspaceID))
  }

  const user = useLoggedInUser()

  const userWorkspace = workspaces.find(workspace => workspace.id === user.id)
  const properWorkspaces = workspaces.filter(workspace => workspace.id !== user.id)

  return (
    <>
      <div className='flex flex-col gap-4 px-2 pt-3 pb-4 border-r border-gray-200 bg-gray-25'>
        <SidebarSection>
          <UserSidebarItem />
        </SidebarSection>
        <div className='flex flex-col flex-1 gap-4 pr-2 -mr-2 overflow-y-auto'>
          <SidebarSection>
            {userWorkspace && (
              <SidebarButton
                title={userWorkspace.name}
                icon={fileIcon}
                active={activeWorkspaceID === userWorkspace.id}
                onClick={() => onSelectWorkspace(userWorkspace.id)}
              />
            )}
            {sharedProjects && onSelectSharedProjects && (
              <SidebarButton
                title={sharedProjects.name}
                icon={folderIcon}
                active={activeWorkspaceID === sharedProjects.id}
                onClick={onSelectSharedProjects}
              />
            )}
          </SidebarSection>
          <SidebarSection title='Workspaces' className='flex-1'>
            {[...pendingWorkspaces, ...properWorkspaces].map((workspace, workspaceIndex) => (
              <SidebarButton
                key={workspaceIndex}
                title={workspace.name}
                icon={folderIcon}
                active={activeWorkspaceID === workspace.id}
                onClick={() => onSelectWorkspace(workspace.id)}
              />
            ))}
            <SidebarButton title='New Workspace…' icon={addIcon} onClick={() => setShowPickNamePrompt(true)} />
          </SidebarSection>
          <FeedbackSection />
        </div>
      </div>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Add a new workspace'
          confirmTitle='Add'
          label='Workspace name'
          onConfirm={addWorkspace}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}
