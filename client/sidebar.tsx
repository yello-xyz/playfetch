import { Project } from '@/types'
import PendingButton from './pendingButton'
import { HiOutlineFolderAdd, HiOutlineDocumentAdd } from 'react-icons/hi'
import { useState } from 'react'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
import api from './api'

export default function Sidebar({
  projects = [],
  activeProjectID,
  onSelectProject,
  onLogout,
  onProjectAdded,
  onPromptAdded,
}: {
  projects?: Project[]
  activeProjectID: number | null | undefined
  onSelectProject: (projectID: number | null) => void
  onLogout: () => void
  onProjectAdded: (projectID: number) => void
  onPromptAdded: (promptID: number) => void
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

  const addPrompt = async (projectID: number | null) => {
    const promptID = await api.addPrompt(projectID)
    onPromptAdded(promptID)
  }

  const itemClassName = (active: boolean) => `cursor-pointer ${active ? 'bg-gray-200' : ''}`

  return (
    <div className='flex flex-col gap-4 px-2 py-4 border-r border-gray-200'>
      <SidebarSection>
        <PendingButton onClick={logout}>Log out</PendingButton>
      </SidebarSection>
      <SidebarSection>
        <div className={itemClassName(activeProjectID === null)} onClick={() => onSelectProject(null)}>
          Prompts
        </div>
        <PendingButton onClick={() => addPrompt(null)}>
          <HiOutlineDocumentAdd className='w-5 h-5 mr-2' />
          Add New Prompt
        </PendingButton>
      </SidebarSection>
      <SidebarSection title='My Projects'>
      {projects.map((project, projectIndex) => (
        <div
          className={itemClassName(activeProjectID === project.id)}
          key={projectIndex}
          onClick={() => onSelectProject(project.id)}>
          {project.name}
        </div>
      ))}
      <div className='flex flex-col gap-4 mt-4'>
        <PendingButton onClick={addProject}>
          <HiOutlineFolderAdd className='w-5 h-5 mr-2' />
          Add New Project
        </PendingButton>
      </div>
      </SidebarSection>
      <PickNameDialog key={projects.length} prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
    </div>
  )
}

function SidebarSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      {title && <div className='px-4 py-1 text-xs font-medium text-gray-400'>{title}</div>}
      {children}
    </div>
  )
}
