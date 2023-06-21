import { Version } from '@/types'
import api from './api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import { useDialogPrompt } from './modalDialogContext'

export default function VersionPopupMenu({
  version,
  isMenuExpanded,
  setIsMenuExpanded,
  onRefreshPrompt,
}: {
  version: Version
  isMenuExpanded: boolean
  setIsMenuExpanded: (isExpanded: boolean) => void
  onRefreshPrompt: () => void
}) {
  const setDialogPrompt = useDialogPrompt()

  const deleteVersion = async () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      message: `Are you sure you want to delete this version? This action cannot be undone.`,
      callback: () => api.deleteVersion(version.id).then(onRefreshPrompt),
      destructive: true,
    })
  }

  return (
    <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
      <PopupMenuItem destructive title='Delete' callback={deleteVersion} />
    </PopupMenu>
  )
}
