import { Project } from '@/types'
import { Sidebar } from 'flowbite-react'
import { BuildUniqueName, Truncate } from '@/common/formatting'
import PendingButton from './pendingButton'
import { HiOutlineFolderAdd } from 'react-icons/hi'
import { useState } from 'react'
import ProjectNameDialog, { ProjectDialogPrompt } from './projectNameDialog'
import api from './api'

export default function ProjectSidebar({
  projects = [],
  activePromptID,
  updateActivePrompt,
  onLogout,
  onRefresh,
}: {
  projects?: Project[]
  activePromptID?: number
  updateActivePrompt?: (promptID: number) => void
  onLogout: () => void
  onRefresh: (promptID: number) => void
}) {
  const [dialogPrompt, setDialogPrompt] = useState<ProjectDialogPrompt>()

  const logout = async () => {
    await api.logout()
    onLogout()
  }

  const defaultNewProjectName = 'New Project'

  const uniqueProjectName = BuildUniqueName(
    defaultNewProjectName,
    projects.map(project => project.name)
  )

  const addProject = async () => {
    setDialogPrompt({
      message: 'Add a new project',
      callback: async (name: string) => {
        const promptID = await api.addProject(name)
        onRefresh(promptID)
      },
    })
  }

  const addPrompt = async (projectID: number) => {
    const promptID = await api.addPrompt(projectID)
    onRefresh(promptID)
  }

  return (
    <Sidebar className='h-screen'>
      <div className='flex flex-col gap-4'>
        <PendingButton onClick={logout}>Log out</PendingButton>
        <PendingButton onClick={addProject}>
          <HiOutlineFolderAdd className='w-5 h-5 mr-2' />
          Add New Project
        </PendingButton>
      </div>
      <Sidebar.Items>
        {projects.map((project, projectIndex) => (
          <Sidebar.Collapse key={projectIndex} label={project.name}>
            <Sidebar.Item>
              <PendingButton onClick={() => addPrompt(project.id)}>Add Prompt</PendingButton>
            </Sidebar.Item>
            {project.prompts.map((prompt, promptIndex) => (
              <Sidebar.Item
                className='cursor-pointer'
                key={promptIndex}
                active={activePromptID === prompt.id}
                onClick={() => updateActivePrompt?.(prompt.id)}>
                {Truncate(prompt.name, 20)}
              </Sidebar.Item>
            ))}
          </Sidebar.Collapse>
        ))}
      </Sidebar.Items>
      <ProjectNameDialog
        key={uniqueProjectName}
        suggestedProjectName={uniqueProjectName}
        prompt={dialogPrompt}
        setPrompt={setDialogPrompt}
      />
    </Sidebar>
  )
}
