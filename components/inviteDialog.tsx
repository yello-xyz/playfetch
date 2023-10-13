import { useCallback, useState } from 'react'
import ModalDialog from './modalDialog'
import { CheckValidEmail } from '@/src/common/formatting'
import TextInput from './textInput'

export default function InviteDialog({
  label,
  onConfirm,
  onDismiss,
}: {
  label: string
  onConfirm: (emails: string[]) => void
  onDismiss: () => void
}) {
  const [email, setEmail] = useState('')

  const emails = email
    .split(/[\s,]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0)

  const dialogPrompt = {
    title: `Invite to ${label}`,
    confirmTitle: 'Invite',
    callback: () => onConfirm(emails),
    disabled: !emails.length || !emails.every(email => CheckValidEmail(email)),
  }

  const onLoad = useCallback((node: HTMLInputElement | null) => node?.focus(), [])

  return (
    <ModalDialog prompt={dialogPrompt} onDismiss={onDismiss}>
      <div className='flex flex-col gap-4'>
        <TextInput onLoad={onLoad} id='email' label='Email addresses' value={email} setValue={setEmail} />
      </div>
    </ModalDialog>
  )
}
