import { useCallback, useState } from 'react'
import { CheckValidEmail, FormatRelativeDate } from '@/src/common/formatting'
import Button from '../button'
import { PendingUser, User } from '@/types'
import TextInput from '../textInput'
import UserBadge from './userBadge'
import useFormattedDate from '@/src/client/hooks/useFormattedDate'
import { useLoggedInUser } from '@/src/client/context/userContext'

export default function MembersPane({
  owners = [],
  members,
  pendingMembers,
  onInvite,
  onRevoke,
}: {
  owners?: User[]
  members: User[]
  pendingMembers: PendingUser[]
  onInvite: (emails: string[]) => void
  onRevoke?: (userID: number) => void
}) {
  const [email, setEmail] = useState('')

  const currentUser = useLoggedInUser()

  const emails = email
    .split(/[\s,]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0)

  const previousEmails = new Set([...owners, ...members, ...pendingMembers].map(user => user.email))
  const emailsAreValid =
    emails.length > 0 && emails.every(email => CheckValidEmail(email) && !previousEmails.has(email))

  const onLoad = useCallback((node: HTMLInputElement | null) => node?.focus(), [])

  return (
    <>
      <div className='flex items-center gap-2.5'>
        <TextInput placeholder='Add email addresses' onLoad={onLoad} value={email} setValue={setEmail} />
        <Button disabled={!emailsAreValid} onClick={() => onInvite(emails)}>
          Invite
        </Button>
      </div>
      <SectionHeader>People with access</SectionHeader>
      {owners.map((user, index) => (
        <UserBadge key={index} user={user} suffix={user.id === currentUser.id ? ' (you)' : ''} padding='' />
      ))}
      {members.map((user, index) => (
        <UserBadge key={index} user={user} padding='' />
      ))}
      {pendingMembers.length > 0 && (
        <>
          <SectionHeader>Pending invitations</SectionHeader>
          {pendingMembers.map((user, index) => (
            <PendingUserBadge key={index} user={user} onRevoke={onRevoke} />
          ))}
        </>
      )}
    </>
  )
}

const SectionHeader = ({ children }: { children: string }) => (
  <span className='text-xs font-medium text-gray-400'>{children}</span>
)

function PendingUserBadge({ user, onRevoke }: { user: PendingUser; onRevoke?: (userID: number) => void }) {
  const formattedDate = useFormattedDate(user.timestamp, FormatRelativeDate)

  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex-1 min-w-0'>
        <UserBadge user={user} padding='' />
      </div>
      {onRevoke ? (
        <Button type='destructive' onClick={() => onRevoke(user.id)}>
          Revoke
        </Button>
      ) : (
        <div className='flex flex-col items-end text-xs'>
          <span className='text-gray-700'>
            invited by <span className='font-medium'>{user.invitedBy.fullName}</span>
          </span>
          <span className='text-gray-400'>{formattedDate}</span>
        </div>
      )}
    </div>
  )
}
