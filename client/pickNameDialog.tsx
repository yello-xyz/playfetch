import { useState } from 'react'
import ModalDialog from './modalDialog'
import TextInput from './textInput'

export default function PickNameDialog({
  title,
  confirmTitle,
  label,
  initialName,
  onConfirm,
  onDismiss,
}: {
  title: string
  confirmTitle: string
  label: string
  initialName?: string
  onConfirm: (name: string) => void
  onDismiss: () => void
}) {
  const [name, setName] = useState(initialName ?? '')

  const dialogPrompt = {
    title,
    confirmTitle,
    callback: () => onConfirm(name),
    disabled: name.length === 0,
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <TextInput id='name' label={label} value={name} setValue={setName} />
    </ModalDialog>
  )
}
