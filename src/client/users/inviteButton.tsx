import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/components/globalPopupContext'
import { PopupContent } from '@/src/client/components/popupMenu'
import { CustomPopupButton } from '@/src/client/components/popupButton'
import { PendingUser, User } from '@/types'
import { TopBarButton } from '@/src/client/components/topBarButton'
import MembersPane from './membersPane'

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
  return (
    <PopupContent className='flex flex-col gap-3.5 p-3 w-[485px]'>
      <MembersPane
        members={users}
        pendingMembers={pendingUsers}
        onInvite={emails => withDismiss(() => onInvite(emails))()}
      />
    </PopupContent>
  )
}
