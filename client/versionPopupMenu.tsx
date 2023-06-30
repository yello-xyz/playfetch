import { Version } from '@/types'
import api from './api'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import IconButton from './iconButton'
import dotsIcon from '@/public/dots.svg'
import { useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'
import { CalculatePopupOffset } from './labelPopupMenu'

export default function VersionPopupMenu({ version, containerRect }: { version: Version; containerRect?: DOMRect }) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const refreshPrompt = useRefreshPrompt()

  const setDialogPrompt = useModalDialogPrompt()

  const iconRef = useRef<HTMLDivElement>(null)

  const deleteVersion = async () => {
    setIsMenuExpanded(false)
    setDialogPrompt({
      title: `Are you sure you want to delete this version? This action cannot be undone.`,
      callback: () => api.deleteVersion(version.id).then(_ => refreshPrompt()),
      destructive: true,
    })
  }

  return (
    <>
      <div ref={iconRef}>
        <IconButton icon={dotsIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
      </div>
      {isMenuExpanded && (
        <div className='absolute' style={CalculatePopupOffset(iconRef, containerRect)}>
          <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
            <PopupMenuItem destructive title='Delete' callback={deleteVersion} />
          </PopupMenu>
        </div>
      )}
    </>
  )
}
