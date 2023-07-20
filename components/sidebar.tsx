import { ActiveProject, ActivePrompt, Project, User } from '@/types'
import { ReactNode, useState } from 'react'
import api from '../src/client/api'
import projectIcon from '@/public/project.svg'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import feedbackIcon from '@/public/feedback.svg'
import inviteIcon from '@/public/invite.svg'
import chainIcon from '@/public/chain.svg'
import { useRefreshProject, useRefreshProjects } from './refreshContext'
import UserSidebarItem from './userSidebarItem'
import PickNameDialog from './pickNameDialog'
import InviteDialog from './inviteDialog'
import Icon from './icon'
import { StaticImageData } from 'next/image'
import Link from 'next/link'
import { useLoggedInUser } from './userContext'

export default function Sidebar({
  projects,
  activeProject,
  activePrompt,
  onAddPrompt,
  onSelectProject,
  onSelectChains,
}: {
  projects: Project[]
  activeProject?: ActiveProject
  activePrompt?: ActivePrompt
  onAddPrompt: () => void
  onSelectProject: (projectID: number) => void
  onSelectChains: () => void
}) {
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const refreshProjects = useRefreshProjects()
  const refreshProject = useRefreshProject()

  const user = useLoggedInUser()

  const addProject = async (name: string) => {
    // TODO generalise to add project in current workspace (not just user's Drafts workspace)
    const projectID = await api.addProject(user.id, name)
    await refreshProjects()
    onSelectProject(projectID)
  }

  const inviteMembers = async (projectID: number, emails: string[]) => {
    await api.inviteMembers(projectID, emails)
    await refreshProjects()
    if (activeProject) {
      refreshProject()
    }
  }

  // TODO just a temporary hack while we rework the UI for workspaces
  const userProject = projects.find(project => project.name === 'Prompts')
  const properProjects = projects.filter(project => project.name !== 'Prompts')
  const activeProjectID = activeProject?.id ?? activePrompt?.projectID

  return (
    <>
      <div className='flex flex-col gap-6 px-2 py-4 border-r border-gray-200'>
        <SidebarSection>
          <UserSidebarItem />
        </SidebarSection>
        <SidebarSection>
          {userProject && (
            <SidebarButton
              title={userProject.name}
              icon={promptIcon}
              active={activeProject?.id === userProject.id}
              onClick={() => onSelectProject(userProject.id)}
            />
          )}
          <SidebarButton title='Chains' icon={chainIcon} onClick={onSelectChains} />
          <SidebarButton title='New Prompt…' icon={addIcon} onClick={onAddPrompt} />
        </SidebarSection>
        <SidebarSection title='My Projects' className='flex-1'>
          {properProjects.map((project, projectIndex) => (
            <SidebarButton
              key={projectIndex}
              title={project.name}
              icon={projectIcon}
              active={activeProject?.id === project.id}
              onClick={() => onSelectProject(project.id)}
            />
          ))}
          <SidebarButton title='Add new Project…' icon={addIcon} onClick={() => setShowPickNamePrompt(true)} />
        </SidebarSection>
        <SidebarSection>
          <SidebarButton title='Invite Members' icon={inviteIcon} onClick={() => setShowInviteDialog(true)} />
          <SidebarButton
            title='Feedback'
            icon={feedbackIcon}
            link='mailto:hello@yello.xyz?subject=Play/Fetch Feedback'
          />
        </SidebarSection>
      </div>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Add a new project'
          confirmTitle='Add'
          label='Project name'
          onConfirm={addProject}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
      {showInviteDialog && (
        <InviteDialog
          objects={projects}
          initialObjectID={activeProjectID}
          label='project'
          onConfirm={inviteMembers}
          onDismiss={() => setShowInviteDialog(false)}
        />
      )}
    </>
  )
}

function SidebarSection({ className, title, children }: { className?: string; title?: string; children: ReactNode }) {
  return (
    <div className={`${className ?? ''} flex flex-col gap-0.5`}>
      {title && <div className='px-4 py-1 text-xs font-medium text-gray-400'>{title}</div>}
      {children}
    </div>
  )
}

function SidebarButton({
  title,
  icon,
  active = false,
  onClick,
  link,
}: {
  title: string
  icon?: StaticImageData
  active?: boolean
  onClick?: () => void
  link?: string
}) {
  const activeClass = 'bg-gray-100 rounded-lg'
  const baseClass = 'flex gap-1 items-center px-4 py-1 cursor-pointer'
  const className = `${baseClass} ${active ? activeClass : ''} hover:${activeClass}`
  const LinkWrapper = ({ children }: { children: ReactNode }) =>
    link ? <Link href={link}>{children}</Link> : <>{children}</>
  return (
    <LinkWrapper>
      <div className={className} onClick={onClick}>
        {icon && <Icon icon={icon} />}
        <div className='font-normal w-36'>{title}</div>
      </div>
    </LinkWrapper>
  )
}
