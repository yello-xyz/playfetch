import { Project } from '@/types'
import { Sidebar } from 'flowbite-react'
import PendingButton from './pendingButton'
import { HiOutlineFolderAdd, HiOutlineDocumentAdd, HiOutlineFolder } from 'react-icons/hi'
import { TbPrompt } from 'react-icons/tb'
import { useState } from 'react'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
import api from './api'

export default function ProjectSidebar({
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

  return (
    <Sidebar className='h-screen'>
      <div className='flex flex-col gap-4 mb-4'>
        <PendingButton onClick={logout}>Log out</PendingButton>
        <PendingButton onClick={() => addPrompt(null)}>
          <HiOutlineDocumentAdd className='w-5 h-5 mr-2' />
          Add New Prompt
        </PendingButton>
      </div>
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item
            active={activeProjectID === null}
            className='cursor-pointer'
            icon={TbPrompt}
            onClick={() => onSelectProject(null)}>
            Prompts
          </Sidebar.Item>
          {projects.map((project, projectIndex) => (
            <Sidebar.Item
              className='cursor-pointer'
              key={projectIndex}
              active={activeProjectID === project.id}
              icon={HiOutlineFolder}
              onClick={() => onSelectProject(project.id)}>
              {project.name}
            </Sidebar.Item>
          ))}
        </Sidebar.ItemGroup>
      </Sidebar.Items>
      <div className='flex flex-col gap-4 mt-4'>
        <PendingButton onClick={addProject}>
          <HiOutlineFolderAdd className='w-5 h-5 mr-2' />
          Add New Project
        </PendingButton>
      </div>
      <PickNameDialog key={projects.length} prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
    </Sidebar>
  )
}
