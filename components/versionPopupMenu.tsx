import { Version } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset, PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import IconButton from './iconButton'
import dotsIcon from '@/public/dots.svg'
import { useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'

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
        <IconButton icon={dotsIcon} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
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
