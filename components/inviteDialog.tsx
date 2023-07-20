import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Project, Workspace } from '@/types'
import { CheckValidEmail } from '@/src/common/formatting'
import TextInput from './textInput'
import DropdownMenu from './dropdownMenu'

export default function InviteDialog({
  objects,
  initialObjectID,
  label,
  onConfirm,
  onDismiss,
}: {
  objects: (Project | Workspace)[]
  initialObjectID?: number
  label: string
  onConfirm: (objectID: number, emails: string[]) => void
  onDismiss: () => void
}) {
  const [email, setEmail] = useState('')
  const [objectID, setObjectID] = useState(initialObjectID)

  const emails = email
    .split(/[\s,]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0)

  const dialogPrompt = {
    title: `Invite to ${label}`,
    confirmTitle: 'Invite',
    callback: () => onConfirm(objectID!, emails),
    disabled: !objectID || !emails.length || !emails.every(email => CheckValidEmail(email)),
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <div className='flex flex-col gap-4'>
        <DropdownMenu value={objectID ?? 0} onChange={value => setObjectID(Number(value))}>
          {!objectID && (
            <option value={0} disabled>
              Select a project
            </option>
          )}
          {objects.map((object, index) => (
            <option key={index} value={object.id}>
              {object.name}
            </option>
          ))}
        </DropdownMenu>
        <TextInput id='email' label='Email addresses' value={email} setValue={setEmail} />
      </div>
    </ModalDialog>
  )
}
