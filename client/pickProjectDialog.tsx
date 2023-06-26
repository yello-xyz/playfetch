import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Project, Prompt } from '@/types'

export default function PickProjectDialog({
  projects,
  prompt,
  onConfirm,
  onDismiss,
}: {
  projects: Project[]
  prompt: Prompt
  onConfirm: (projectID: number) => void
  onDismiss: () => void
}) {
  const [projectID, setProjectID] = useState(prompt.projectID)

  const dialogPrompt = {
    title: `Move “${prompt.name}”`,
    confirmTitle: 'Move',
    callback: () => onConfirm(projectID!),
    disabled: projectID === prompt.projectID,
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <select
        className='w-full p-2 text-xs rounded-md'
        value={projectID.toString()}
        onChange={event => setProjectID(Number(event.target.value))}>
        {!projectID && (
          <option value={0} disabled>
            Select a project
          </option>
        )}
        {projects.map((project, index) => (
          <option key={index} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </ModalDialog>
  )
}
