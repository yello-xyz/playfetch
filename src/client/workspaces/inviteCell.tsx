import { User } from '@/types'
import { FormatRelativeDate } from '@/src/common/formatting'
import Button from '../components/button'
import UserAvatar from '../users/userAvatar'
import useFormattedDate from '@/src/client/components/useFormattedDate'
import ModalDialog, { DialogPrompt } from '../components/modalDialog'
import { useState } from 'react'

export function InviteCell({
  item,
  label,
  onRespond,
}: {
  item: {
    name: string
    invitedBy: User
    timestamp: number
  }
  label: string
  onRespond: (accept: boolean) => void
}) {
  const formattedDate = useFormattedDate(item.timestamp, FormatRelativeDate)
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()

  const promptDecline = () =>
    setDialogPrompt({
      title: `Decline invitation to join “${item.name}”?`,
      content: `You won’t be able to access this ${label} unless someone invites you again.`,
      confirmTitle: 'Decline',
      destructive: true,
      callback: async () => onRespond(false),
    })

  return (
    <div className='flex items-center justify-between w-full gap-6 px-4 py-3 border border-gray-200 rounded-lg select-none bg-gray-25'>
      <div className='flex flex-col gap-2'>
        <span className='flex-1 text-base font-medium text-gray-700 line-clamp-2'>{item.name}</span>
        <div className='flex items-center gap-2 text-sm'>
          <UserAvatar size='md' user={item.invitedBy} />
          <span className='text-gray-700'>{item.invitedBy.fullName} invited you</span>
          <span className='-ml-1 text-gray-400'>• {formattedDate}</span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Button type='outline' onClick={promptDecline}>
          Decline
        </Button>
        <Button type='primary' onClick={() => onRespond(true)}>
          Accept
        </Button>
      </div>
      <ModalDialog prompt={dialogPrompt} onDismiss={() => setDialogPrompt(undefined)} />
    </div>
  )
}
