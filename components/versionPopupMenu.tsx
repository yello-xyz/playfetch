import { VersionWithReferences } from '@/types'
import api from '../src/client/api'
import PopupMenu, { CalculatePopupOffset, PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from './modalDialogContext'
import IconButton from './iconButton'
import dotsIcon from '@/public/dots.svg'
import { useRef, useState } from 'react'
import { useRefreshPrompt } from './refreshContext'

export default function VersionPopupMenu({
  version,
  containerRect,
}: {
  version: VersionWithReferences
  containerRect?: DOMRect
}) {
  const [isMenuExpanded, setMenuExpanded] = useState(false)

  const refreshPrompt = useRefreshPrompt()

  const setDialogPrompt = useModalDialogPrompt()

  const iconRef = useRef<HTMLDivElement>(null)

  const deleteVersion = async () => {
    setMenuExpanded(false)
    if (version.usedAsEndpoint || version.usedInChain) {
      const reason = version.usedAsEndpoint ? `published as an endpoint` : `used in chain “${version.usedInChain}”`
      setDialogPrompt({
        title: `Cannot delete version because it is ${reason}.`,
        confirmTitle: 'OK',
        cancellable: false,
      })
    } else {
      setDialogPrompt({
        title: `Are you sure you want to delete this version? This action cannot be undone.`,
        callback: () => api.deleteVersion(version.id).then(_ => refreshPrompt()),
        destructive: true,
      })
    }
  }

  return (
    <>
      <div ref={iconRef}>
        <IconButton icon={dotsIcon} onClick={() => setMenuExpanded(!isMenuExpanded)} />
      </div>
      {isMenuExpanded && (
        <div className='absolute' style={CalculatePopupOffset(iconRef, containerRect)}>
          <PopupMenu className='w-40' expanded={isMenuExpanded} collapse={() => setMenuExpanded(false)}>
            <PopupMenuItem destructive title='Delete' callback={deleteVersion} />
          </PopupMenu>
        </div>
      )}
    </>
  )
}
