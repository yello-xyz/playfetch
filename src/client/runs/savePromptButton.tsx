import useGlobalPopup, { GlobalPopupLocation, WithDismiss } from '@/src/client/components/globalPopupContext'
import { PopupContent, PopupMenuItem } from '../components/popupMenu'
import { CustomPopupButton } from '../components/popupButton'
import chevronIcon from '@/public/chevronWhite.svg'
import Icon from '../components/icon'

export default function SavePromptButton({ onSave }: { onSave: () => void }) {
  const setPopup = useGlobalPopup<SaveButtonPopupProps>()

  const onSetPopup = (location: GlobalPopupLocation) => setPopup(SaveButtonPopup, { onSave }, location)

  const layoutClass = 'flex items-center justify-between gap-1 pl-0.5 pr-1 py-1'
  const styleClass = 'bg-blue-400 border-l-2 border-blue-600 rounded-r-lg cursor-pointer hover:bg-blue-300'

  return (
    <CustomPopupButton className={`${layoutClass} ${styleClass}`} popUpAbove onSetPopup={onSetPopup}>
      <Icon icon={chevronIcon} />
    </CustomPopupButton>
  )
}

type SaveButtonPopupProps = { onSave: () => void }

const SaveButtonPopup = ({ onSave, withDismiss }: SaveButtonPopupProps & WithDismiss) => (
  <PopupContent className='flex flex-col' autoOverflow={false}>
    <PopupMenuItem title='Save Prompt' callback={withDismiss(onSave)} first last />
  </PopupContent>
)
