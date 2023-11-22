import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'
import { PopupContent } from '../popupMenu'
import { CustomPopupButton } from '../popupButton'
import { PendingUser, User } from '@/types'
import { TopBarButton } from '../topBarButton'
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
        users={users}
        pendingUsers={pendingUsers}
        onInvite={emails => withDismiss(() => onInvite(emails))()}
      />
    </PopupContent>
  )
}
