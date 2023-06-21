import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Project } from '@/types'

export type PickProjectPrompt = {
  callback: (projectID: number) => void
  initialProjectID: number | null
}

export default function PickProjectDialog({
  projects,
  prompt,
  setPrompt,
}: {
  projects: Project[]
  prompt?: PickProjectPrompt
  setPrompt: (prompt?: PickProjectPrompt) => void
}) {
  const [projectID, setProjectID] = useState<number | null>(prompt?.initialProjectID ?? null)

  const dialogPrompt = prompt
    ? {
        message: 'Move Prompt to Project',
        callback: () => prompt.callback(projectID!),
        disabled: projectID === prompt.initialProjectID || projectID === null,
      }
    : undefined

  return (
    <ModalDialog prompt={dialogPrompt} setPrompt={() => setPrompt()}>
      <div className='text-sm text-gray-500'>
        <select
          className='w-full p-2 text-sm text-gray-500 border border-gray-300 rounded-md'
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
