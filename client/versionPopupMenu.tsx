import { Version } from '@/types'
import api from './api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import { useDialogPrompt } from './modalDialogContext'
import IconButton from './iconButton'
import dotsIcon from '@/public/dots.svg'
import { useState } from 'react'

export default function VersionPopupMenu({
  version,
  onRefreshPrompt,
}: {
  version: Version
  onRefreshPrompt: () => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

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
    <div className='relative flex'>
      <IconButton icon={dotsIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
      {isMenuExpanded && (
        <div className='absolute right-0 top-7'>
          <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <PopupMenuItem destructive title='Delete' callback={deleteVersion} />
          </PopupMenu>
        </div>
      )}
    </div>
  )
}
