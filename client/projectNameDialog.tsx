import { useState } from 'react'
import ModalDialog from './modalDialog';
import LabeledTextInput from './labeledTextInput';

export type ProjectDialogPrompt = { message: string; callback: (name: string) => void }

export default function ProjectNameDialog({
  suggestedProjectName,
  prompt,
  setPrompt,
}: {
  suggestedProjectName: string
  prompt?: ProjectDialogPrompt
  setPrompt: (prompt?: ProjectDialogPrompt) => void
}) {
  const [projectName, setProjectName] = useState(suggestedProjectName)

  const dialogPrompt = prompt
    ? {
        message: prompt.message,
        callback: () => prompt.callback(projectName),
      }
    : undefined

  return (
    <ModalDialog prompt={dialogPrompt} setPrompt={() => setPrompt()}>
      <LabeledTextInput id='name' label='Project Name:' value={projectName} setValue={setProjectName} />
    </ModalDialog>
  )
}
