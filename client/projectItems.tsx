import { Project } from '@/types';
import { Sidebar } from 'flowbite-react';
import { Truncate } from '@/common/formatting';
import PendingButton from './pendingButton';

export default function ProjectItems({
  projects,
  activePromptID,
  addPrompt,
  updateActivePrompt,
}: {
  projects: Project[]
  activePromptID: number
  addPrompt: (projectID: number) => void
  updateActivePrompt: (promptID: number) => void
}) {
  return (
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
              onClick={() => updateActivePrompt(prompt.id)}>
              {Truncate(prompt.name, 20)}
            </Sidebar.Item>
          ))}
        </Sidebar.Collapse>
      ))}
    </Sidebar.Items>
  )
}
