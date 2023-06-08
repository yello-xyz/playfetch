import { useState } from 'react'
import ModalDialog from './modalDialog'
import LabeledTextInput from './labeledTextInput'
import api from './api'

export type ProjectDialogPrompt = { message: string; callback: (name: string) => void }

export default function ProjectNameDialog({
  prompt,
  setPrompt,
}: {
  prompt?: ProjectDialogPrompt
  setPrompt: (prompt?: ProjectDialogPrompt) => void
}) {
  const [projectName, setProjectName] = useState('')
  const [isValidProjectName, setValidProjectName] = useState(false)

  const dialogPrompt = prompt
    ? {
        message: prompt.message,
        callback: () => prompt.callback(projectName),
        disabled: !isValidProjectName,
      }
    : undefined

  const updateProjectName = (name: string) => {
    setProjectName(name)
    setValidProjectName(false)
    api.checkProjectName(name).then(setValidProjectName)
  }

  return (
    <ModalDialog prompt={dialogPrompt} setPrompt={() => setPrompt()}>
      <LabeledTextInput id='name' label='Project Name:' value={projectName} setValue={updateProjectName} />
    </ModalDialog>
  )
}
