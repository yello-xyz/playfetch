import { PopupContent, PopupMenuItem } from '../popupMenu'
import dotsIcon from '@/public/dots.svg'
import GlobalPopupMenu from '../globalPopupMenu'

export default function ChainNodePopupMenu({
  onDelete,
  onEdit,
  onRename,
  selected,
}: {
  onDelete: () => void
  onEdit: () => void
  onRename?: () => void
  selected?: boolean
}) {
  const loadPopup = (): [typeof ChainNodePopup, ChainNodePopupProps] => [ChainNodePopup, { onDelete, onEdit, onRename }]

  return <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} selectedCell={selected} />
}

type ChainNodePopupProps = {
  onDelete: () => void
  onEdit: () => void
  onRename?: () => void
  onDismissGlobalPopup?: () => void
}

function ChainNodePopup({ onDelete, onEdit, onRename, onDismissGlobalPopup }: ChainNodePopupProps) {
  const dismissAndCallback = (callback: () => void) => () => {
    onDismissGlobalPopup?.()
    callback()
  }

  return (
    <PopupContent className='w-40'>
      {onRename && <PopupMenuItem title='Rename' callback={dismissAndCallback(onRename)} first />}
      <PopupMenuItem title='Edit' callback={dismissAndCallback(onEdit)} first={!onRename} />
      <PopupMenuItem destructive title='Delete' callback={dismissAndCallback(onDelete)} last />
    </PopupContent>
  )
}
