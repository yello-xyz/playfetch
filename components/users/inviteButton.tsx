import { useCallback, useState } from 'react'
import { CheckValidEmail } from '@/src/common/formatting'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../popupMenu'
import { CustomPopupButton, PopupButton } from '../popupButton'
import Button from '../button'
import { User } from '@/types'
import TextInput from '../textInput'
import { TopBarButton } from '../topBarButton'

export default function InviteButton({ users, onInvite }: { users: User[]; onInvite: (emails: string[]) => void }) {
  const setPopup = useGlobalPopup<InvitePopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) => {
    setPopup(InvitePopup, { users, onInvite }, location)
  }

  return (
    <CustomPopupButton onSetPopup={onSetPopup} fixedWidth>
      <TopBarButton title='Invite' />
    </CustomPopupButton>
  )
}

type InvitePopupProps = {
  users: User[]
  onInvite: (emails: string[]) => void
}

function InvitePopup({ users, onInvite, withDismiss }: InvitePopupProps & WithDismiss) {
  const [email, setEmail] = useState('')

  const emails = email
    .split(/[\s,]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0)

  const onLoad = useCallback((node: HTMLInputElement | null) => node?.focus(), [])

  return (
    <PopupContent className='flex flex-col gap-1 p-3'>
      <TextInput onLoad={onLoad} id='email' label='Email addresses' value={email} setValue={setEmail} />
      <Button
        disabled={!emails.length || !emails.every(email => CheckValidEmail(email))}
        onClick={() => onInvite(emails)}>
        Invite
      </Button>
    </PopupContent>
  )
}
