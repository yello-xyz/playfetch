import { ActiveProject, Project, User } from '@/types'
import { ReactNode, useState } from 'react'
import api from './api'
import projectIcon from '@/public/project.svg'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'
import { useRefreshProjects, useSelectProject } from './refreshContext'
import UserSidebarItem from './userSidebarItem'
import PickNameDialog from './pickNameDialog'

export default function Sidebar({
  user,
  projects,
  activeProject,
  onAddPrompt,
}: {
  user: User
  projects: Project[]
  activeProject?: ActiveProject
  onAddPrompt: () => void
}) {
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

  const refreshProjects = useRefreshProjects()
  const selectProject = useSelectProject()

  const addProject = async (name: string) => {
    const projectID = await api.addProject(name)
    await refreshProjects()
    selectProject(projectID)
  }

  const userProject = projects.find(project => project.id === user.id)
  const properProjects = projects.filter(project => project.id !== user.id)

  return (
    <>
      <div className='flex flex-col gap-6 px-2 py-4 border-r border-gray-200'>
        <SidebarSection>
          <UserSidebarItem user={user} />
        </SidebarSection>
        <SidebarSection>
          {userProject && (
            <SidebarButton
              title={userProject.name}
              icon={promptIcon.src}
              active={activeProject?.id === userProject.id}
              onClick={() => selectProject(userProject.id)}
            />
          )}
          <SidebarButton title='New Prompt…' icon={addIcon.src} onClick={onAddPrompt} />
        </SidebarSection>
        <SidebarSection title='My Projects'>
          {properProjects.map((project, projectIndex) => (
            <SidebarButton
              key={projectIndex}
              title={project.name}
              icon={projectIcon.src}
              active={activeProject?.id === project.id}
              onClick={() => selectProject(project.id)}
            />
          ))}
          <SidebarButton title='Add new Project…' icon={addIcon.src} onClick={() => setShowPickNamePrompt(true)} />
        </SidebarSection>
      </div>
      {showPickNamePrompt && (
        <PickNameDialog
          title='Add a new project'
          label='Project name'
          validator={name => api.checkProjectName(name)}
          onConfirm={addProject}
          onDismiss={() => setShowPickNamePrompt(false)}
        />
      )}
    </>
  )
}

function SidebarSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5'>
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
}: {
  title: string
  icon?: string
  active?: boolean
  onClick: () => void
}) {
  const activeClass = 'bg-gray-100 rounded-lg'
  const baseClass = 'flex gap-1 items-center px-4 py-1 cursor-pointer'
  const className = `${baseClass} ${active ? activeClass : ''} hover:${activeClass}`
  return (
    <div className={className} onClick={onClick}>
      {icon && <img className='w-6 h-6' src={icon} />}
      <div className='font-normal w-36'>{title}</div>
    </div>
  )
}
