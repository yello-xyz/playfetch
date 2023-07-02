import { useState } from 'react'
import ModalDialog from './modalDialog'
import { Project } from '@/types'
import { CheckValidEmail } from '@/src/common/formatting'
import TextInput from './textInput'
import DropdownMenu from './dropdownMenu'

export default function InviteDialog({
  projects,
  initialProjectID,
  onConfirm,
  onDismiss,
}: {
  projects: Project[]
  initialProjectID?: number
  onConfirm: (projectID: number, emails: string[]) => void
  onDismiss: () => void
}) {
  const [email, setEmail] = useState('')
  const [projectID, setProjectID] = useState(initialProjectID)

  const emails = email
    .split(/[\s,]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0)

  const dialogPrompt = {
    title: `Invite to project`,
    confirmTitle: 'Invite',
    callback: () => onConfirm(projectID!, emails),
    disabled: !projectID || !emails.length || !emails.every(email => CheckValidEmail(email)),
  }

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <div className='flex flex-col gap-4'>
        <DropdownMenu value={projectID ?? 0} onChange={value => setProjectID(Number(value))}>
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
        </DropdownMenu>
        <TextInput id='email' label='Email addresses' value={email} setValue={setEmail} />
      </div>
    </ModalDialog>
  )
}
