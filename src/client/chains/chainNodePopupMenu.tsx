import { PopupContent, PopupMenuItem } from '../components/popupMenu'
import dotsIcon from '@/public/dots.svg'
import GlobalPopupMenu from '../components/globalPopupMenu'
import { WithDismiss } from '@/src/client/context/globalPopupContext'

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
}

function ChainNodePopup({ onRename, onDuplicate, onEdit, onDelete, withDismiss }: ChainNodePopupProps & WithDismiss) {
  return (
    <PopupContent className='w-40'>
      {onRename && <PopupMenuItem title='Rename' callback={withDismiss(onRename)} first />}
      <PopupMenuItem title='Duplicate' callback={withDismiss(onDuplicate)} first={!onRename} />
      <PopupMenuItem title='Edit' callback={withDismiss(onEdit)} />
      <PopupMenuItem destructive title='Delete' callback={withDismiss(onDelete)} last />
    </PopupContent>
  )
}
