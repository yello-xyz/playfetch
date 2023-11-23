import { PopupContent, PopupItem, PopupLabelItem } from '../popupMenu'
import { PopupButton } from '../popupButton'
import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/context/globalPopupContext'

export default function RolePopupButton({
  isOwner,
  onRevoke,
  disabled,
}: {
  isOwner: boolean
  onRevoke: () => void
  disabled?: boolean
}) {
  const setOwner = (owner: boolean) => {} // TODO

  const setRolePopup = useGlobalPopup<RolePopupProps>()

  const onSetRolePopup = (location: GlobalPopupLocation) =>
    setRolePopup(RolePopup, { isOwner, setOwner, onRevoke }, location)

  return (
    <PopupButton fixedWidth disabled={disabled} onSetPopup={onSetRolePopup}>
      <span className='flex-1 pl-1 overflow-hidden text-gray-600 whitespace-nowrap text-ellipsis'>
        {isOwner ? 'Owner' : 'Member'}
      </span>
    </PopupButton>
  )
}

type RolePopupProps = { isOwner: boolean; setOwner: (owner: boolean) => void; onRevoke: () => void }

const RolePopup = ({ isOwner, setOwner, onRevoke, withDismiss }: RolePopupProps & WithDismiss) => (
  <PopupContent className='p-3 min-w-[280px]'>
    <PopupLabelItem
      title='Owner'
      description='Can modify API keys, usage limits, and team administration.'
      onClick={withDismiss(() => setOwner(true))}
      checked={isOwner}
    />
    <PopupLabelItem
      title='Member'
      description='Can create, test prompts and chains and deploy endpoints.'
      onClick={withDismiss(() => setOwner(false))}
      checked={!isOwner}
    />
    <div className='my-2 border-t border-gray-200' />
    <PopupItem onClick={withDismiss(onRevoke)}>
      <div className='px-3 py-2 text-red-500 rounded hover:text-white hover:bg-red-400'>Remove Team Member</div>
    </PopupItem>
  </PopupContent>
)