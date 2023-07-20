import { ActiveWorkspace, Workspace } from '@/types'
import { useState } from 'react'
import api from '../src/client/api'
import projectIcon from '@/public/project.svg'
import fileIcon from '@/public/file.svg'
import addIcon from '@/public/add.svg'
import feedbackIcon from '@/public/feedback.svg'
import UserSidebarItem from './userSidebarItem'
import PickNameDialog from './pickNameDialog'
import { useLoggedInUser } from './userContext'
import { SidebarButton, SidebarSection } from './sidebar'

export default function WorkspaceSidebar({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onAddProject,
  onRefreshWorkspaces,

}: {
  workspaces: Workspace[]
  activeWorkspace: ActiveWorkspace
  onSelectWorkspace: (workspaceID: number) => void
  onAddProject: () => void
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
      <div className='flex flex-col gap-6 px-2 py-4 border-r border-gray-200'>
        <SidebarSection>
          <UserSidebarItem />
        </SidebarSection>
        <SidebarSection>
          {userWorkspace && (
            <SidebarButton
              title={userWorkspace.name}
              icon={fileIcon}
              active={activeWorkspace.id === userWorkspace.id}
              onClick={() => onSelectWorkspace(userWorkspace.id)}
            />
          )}
          <SidebarButton title='New Project…' icon={addIcon} onClick={onAddProject} />
        </SidebarSection>
        <SidebarSection title='Workspaces' className='flex-1'>
          {properWorkspaces.map((workspace, workspaceIndex) => (
            <SidebarButton
              key={workspaceIndex}
              title={workspace.name}
              icon={projectIcon}
              active={activeWorkspace.id === workspace.id}
              onClick={() => onSelectWorkspace(workspace.id)}
            />
          ))}
          <SidebarButton title='New Workspace…' icon={addIcon} onClick={() => setShowPickNamePrompt(true)} />
        </SidebarSection>
        <SidebarSection>
          <SidebarButton
            title='Feedback'
            icon={feedbackIcon}
            link='mailto:hello@yello.xyz?subject=Play/Fetch Feedback'
          />
        </SidebarSection>
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
