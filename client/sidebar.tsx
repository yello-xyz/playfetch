import { Project } from '@/types'
import { ReactNode, useState } from 'react'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
import api from './api'
import projectIcon from '@/public/project.svg'
import promptIcon from '@/public/prompt.svg'
import addIcon from '@/public/add.svg'

export default function Sidebar({
  projects = [],
  activeProjectID,
  onSelectProject,
  onLogout,
  onProjectAdded,
  onAddPrompt,
}: {
  projects?: Project[]
  activeProjectID: number | null | undefined
  onSelectProject: (projectID: number | null) => void
  onLogout: () => void
  onProjectAdded: (projectID: number) => void
  onAddPrompt: () => void
}) {
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()

  const logout = async () => {
    await api.logout()
    onLogout()
  }

  const addProject = async () => {
    setPickNamePrompt({
      title: 'Add a new project',
      label: 'Project name',
      callback: async (name: string) => {
        const projectID = await api.addProject(name)
        onProjectAdded(projectID)
      },
      validator: name => api.checkProjectName(name),
    })
  }

  return (
    <div className='flex flex-col gap-6 px-2 py-4 border-r border-gray-200'>
      <SidebarSection>
        <SidebarButton title='Log out' onClick={logout} />
      </SidebarSection>
      <SidebarSection>
        <SidebarButton
          title='Prompts'
          icon={promptIcon.src}
          active={activeProjectID === null}
          onClick={() => onSelectProject(null)}
        />
        <SidebarButton title='New Prompt…' icon={addIcon.src} onClick={onAddPrompt} />
      </SidebarSection>
      <SidebarSection title='My Projects'>
        {projects.map((project, projectIndex) => (
          <SidebarButton
            key={projectIndex}
            title={project.name}
            icon={projectIcon.src}
            active={activeProjectID === project.id}
            onClick={() => onSelectProject(project.id)}
          />
        ))}
        <SidebarButton title='Add new Project…' icon={addIcon.src} onClick={addProject} />
      </SidebarSection>
      <PickNameDialog key={projects.length} prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
    </div>
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
      <div className='text-sm font-normal text-grey-800 min-w-[150px]'>{title}</div>
    </div>
  )
}
