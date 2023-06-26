import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Project } from '@/types'

export type PickProjectPrompt = {}

export default function PickProjectDialog({
  projects,
  initialProjectID,
  onConfirm,
  onDismiss,
}: {
  projects: Project[]
  initialProjectID: number
  onConfirm: (projectID: number) => void
  onDismiss: () => void
}) {
  const [projectID, setProjectID] = useState(initialProjectID)

  const dialogPrompt = {
    message: 'Move Prompt to Project',
    callback: () => onConfirm(projectID!),
    disabled: projectID === initialProjectID,
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <div className='text-gray-500'>
        <select
          className='w-full p-2 text-gray-500 border border-gray-300 rounded-md'
          value={projectID?.toString() ?? 0}
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
      </div>
    </ModalDialog>
  )
}
