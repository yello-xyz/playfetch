import { PopupContent, PopupMenuItem } from '../popupMenu'
import dotsIcon from '@/public/dots.svg'
import GlobalPopupMenu from '../globalPopupMenu'

export default function ChainNodePopupMenu({
  onDelete,
  onEdit,
  selected,
}: {
  onDelete: () => void
  onEdit: () => void
  selected?: boolean
}) {
  const loadPopup = (): [typeof ChainNodePopup, ChainNodePopupProps] => [
    ChainNodePopup,
    { deleteNode: onDelete, editNode: onEdit },
  ]

  return <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} selectedCell={selected} />
}

type ChainNodePopupProps = { deleteNode: () => void; editNode: () => void; onDismissGlobalPopup?: () => void }

function ChainNodePopup({ deleteNode, editNode, onDismissGlobalPopup }: ChainNodePopupProps) {
  const dismissAndCallback = (callback: () => void) => () => {
    onDismissGlobalPopup?.()
    callback()
  }

  return (
    <PopupContent className='w-40'>
      <PopupMenuItem title='Edit' callback={dismissAndCallback(editNode)} first />
      <PopupMenuItem destructive title='Delete' callback={dismissAndCallback(deleteNode)} last />
    </PopupContent>
  )
}
