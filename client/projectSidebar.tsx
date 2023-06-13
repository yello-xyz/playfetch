import { Project } from '@/types'
import { Sidebar } from 'flowbite-react'
import { Truncate } from '@/common/formatting'
import PendingButton from './pendingButton'
import { HiOutlineFolderAdd, HiOutlineDocumentAdd } from 'react-icons/hi'
import { useState } from 'react'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'
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
        const promptID = await api.addProject(name)
        onRefresh(promptID)
      },
      validator: name => api.checkProjectName(name),
    })
  }

  const addPrompt = async (projectID: number | null) => {
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
        <PendingButton onClick={() => addPrompt(null)}>
          <HiOutlineDocumentAdd className='w-5 h-5 mr-2' />
          Add New Prompt
        </PendingButton>
      </div>
      <Sidebar.Items>
        {projects.map((project, projectIndex) => (
          <Sidebar.Collapse key={projectIndex} label={project.name}>
            <Sidebar.Item>
              <PendingButton onClick={() => addPrompt(project.id)}>
                <HiOutlineDocumentAdd className='w-5 h-5 mr-2' />
                Add Prompt
              </PendingButton>
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
      <PickNameDialog key={projects.length} prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
    </Sidebar>
  )
}
