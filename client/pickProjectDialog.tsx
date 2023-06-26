import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Project, Prompt } from '@/types'
import DropdownMenu from './dropdownMenu'

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
      <DropdownMenu
        value={projectID.toString()}
        onChange={value => setProjectID(Number(value))}>
        {projects.map((project, index) => (
          <option key={index} value={project.id}>
            {project.name}
          </option>
        ))}
      </DropdownMenu>
    </ModalDialog>
  )
}
