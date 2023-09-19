import { PopupContent, PopupMenuItem } from '../popupMenu'
import dotsIcon from '@/public/dots.svg'
import GlobalPopupMenu from '../globalPopupMenu'

export default function ChainNodePopupMenu({ onDelete, selected }: { onDelete: () => void; selected?: boolean }) {
  const loadPopup = (): [typeof ChainNodePopup, ChainNodePopupProps] => [ChainNodePopup, { deleteNode: onDelete }]

  return <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} selectedCell={selected} />
}

type ChainNodePopupProps = { deleteNode: () => void; onDismissGlobalPopup?: () => void }

function ChainNodePopup({ deleteNode, onDismissGlobalPopup }: ChainNodePopupProps) {
  const dismissAndCallback = (callback: () => void) => () => {
    onDismissGlobalPopup?.()
    callback()
  }

  return (
    <PopupContent className='w-40'>
      <PopupMenuItem destructive title='Delete' callback={dismissAndCallback(deleteNode)} first last />
    </PopupContent>
  )
}
