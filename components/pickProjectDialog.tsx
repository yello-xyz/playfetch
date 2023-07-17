import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Chain, Project, Prompt } from '@/types'
import DropdownMenu from './dropdownMenu'

export default function PickProjectDialog({
  projects,
  item,
  onConfirm,
  onDismiss,
}: {
  projects: Project[]
  item: Prompt | Chain
  onConfirm: (projectID: number) => void
  onDismiss: () => void
}) {
  const [projectID, setProjectID] = useState(item.projectID)

  const dialogPrompt = {
    title: `Move “${item.name}”`,
    confirmTitle: 'Move',
    callback: () => onConfirm(projectID!),
    disabled: projectID === item.projectID,
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <DropdownMenu value={projectID.toString()} onChange={value => setProjectID(Number(value))}>
        {projects.map((project, index) => (
          <option key={index} value={project.id}>
            {project.name}
          </option>
        ))}
      </DropdownMenu>
    </ModalDialog>
  )
}
