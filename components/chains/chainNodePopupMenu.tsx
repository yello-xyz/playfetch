import { PopupContent, PopupMenuItem } from '../popupMenu'
import dotsIcon from '@/public/dots.svg'
import GlobalPopupMenu from '../globalPopupMenu'

export default function ChainNodePopupMenu({
  onRename,
  onDuplicate,
  onEdit,
  onDelete,
  selected,
}: {
  onRename?: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
  selected?: boolean
}) {
  const loadPopup = (): [typeof ChainNodePopup, ChainNodePopupProps] => [
    ChainNodePopup,
    { onRename, onDuplicate, onEdit, onDelete },
  ]

  return <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} selectedCell={selected} />
}

type ChainNodePopupProps = {
  onRename?: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
  onDismissGlobalPopup?: () => void
}

function ChainNodePopup({ onRename, onDuplicate, onEdit, onDelete, onDismissGlobalPopup }: ChainNodePopupProps) {
  const dismissAndCallback = (callback: () => void) => () => {
    onDismissGlobalPopup?.()
    callback()
  }

  return (
    <PopupContent className='w-40'>
      {onRename && <PopupMenuItem title='Rename' callback={dismissAndCallback(onRename)} first />}
      <PopupMenuItem title='Duplicate' callback={dismissAndCallback(onDuplicate)} first={!onRename} />
      <PopupMenuItem title='Edit' callback={dismissAndCallback(onEdit)} />
      <PopupMenuItem destructive title='Delete' callback={dismissAndCallback(onDelete)} last />
    </PopupContent>
  )
}
