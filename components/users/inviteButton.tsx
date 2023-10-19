import { useCallback, useState } from 'react'
import { CheckValidEmail, FormatRelativeDate } from '@/src/common/formatting'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../popupMenu'
import { CustomPopupButton } from '../popupButton'
import Button from '../button'
import { PendingUser, User } from '@/types'
import TextInput from '../textInput'
import { TopBarButton } from '../topBarButton'
import UserBadge from './userBadge'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'

export default function InviteButton({
  users,
  pendingUsers,
  onInvite,
}: {
  users: User[]
  pendingUsers: PendingUser[]
  onInvite: (emails: string[]) => void
}) {
  const setPopup = useGlobalPopup<InvitePopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) => {
    setPopup(InvitePopup, { users, pendingUsers, onInvite }, location)
  }

  return (
    <CustomPopupButton onSetPopup={onSetPopup} alignRight>
      <TopBarButton title='Invite' />
    </CustomPopupButton>
  )
}

type InvitePopupProps = {
  users: User[]
  pendingUsers: PendingUser[]
  onInvite: (emails: string[]) => void
}

function InvitePopup({ users, pendingUsers, onInvite, withDismiss }: InvitePopupProps & WithDismiss) {
  const [email, setEmail] = useState('')

  const emails = email
    .split(/[\s,]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0)

  const previousEmails = new Set(users.map(user => user.email))
  const emailsAreValid =
    emails.length > 0 && emails.every(email => CheckValidEmail(email) && !previousEmails.has(email))

  const onLoad = useCallback((node: HTMLInputElement | null) => node?.focus(), [])

  return (
    <PopupContent className='flex flex-col gap-3.5 p-3 w-[485px]'>
      <div className='flex items-center gap-2.5'>
        <TextInput placeholder='Add email addresses' onLoad={onLoad} value={email} setValue={setEmail} />
        <Button disabled={!emailsAreValid} onClick={withDismiss(() => onInvite(emails))}>
          Invite
        </Button>
      </div>
      <SectionHeader>People with access</SectionHeader>
      {users.map((user, index) => (
        <UserBadge key={index} user={user} padding='' />
      ))}
      {pendingUsers.length > 0 && (
        <>
          <SectionHeader>Pending invitations</SectionHeader>
          {pendingUsers.map((user, index) => (
            <PendingUserBadge key={index} user={user} />
          ))}
        </>
      )}
    </PopupContent>
  )
}

const SectionHeader = ({ children }: { children: string }) => (
  <span className='text-xs font-medium text-gray-400'>{children}</span>
)

function PendingUserBadge({ user }: { user: PendingUser }) {
  const formattedDate = useFormattedDate(user.timestamp, FormatRelativeDate)

  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex-1 min-w-0'>
        <UserBadge user={user} padding='' />
      </div>
      <div className='flex flex-col items-end text-xs'>
        <span className='text-gray-700'>
          invited by <span className='font-medium'>{user.invitedBy.fullName}</span>
        </span>
        <span className='text-gray-400'>{formattedDate}</span>
      </div>
    </div>
  )
}
