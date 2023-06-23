import { Version } from '@/types'
import api from './api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import { useDialogPrompt } from './modalDialogContext'
import IconButton from './iconButton'
import dotsIcon from '@/public/dots.svg'
import { useState } from 'react'
import { useRefreshPrompt } from './refreshContext'

export default function VersionPopupMenu({ version }: { version: Version }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshPrompt = useRefreshPrompt()

  const setDialogPrompt = useDialogPrompt()

  const deleteVersion = async () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      message: `Are you sure you want to delete this version? This action cannot be undone.`,
      callback: () => api.deleteVersion(version.id).then(refreshPrompt),
      destructive: true,
    })
  }

  return (
    <div className='relative flex'>
      <IconButton icon={dotsIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
      {isMenuExpanded && (
        <div className='absolute right-0 top-7'>
          <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <PopupMenuItem destructive title='Delete' callback={deleteVersion} />
          </PopupMenu>
        </div>
      )}
    </div>
  )
}
