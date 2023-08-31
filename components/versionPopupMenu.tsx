import { ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import api from '@/src/client/api'
import { PopupContent, PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import IconButton from './iconButton'
import dotsIcon from '@/public/dots.svg'
import { useRef } from 'react'
import { useRefreshActiveItem } from '@/src/client/context/refreshContext'
import useGlobalPopup from '@/src/client/context/globalPopupContext'

export default function VersionPopupMenu<Version extends PromptVersion | ChainVersion>({
  version,
}: {
  version: Version
}) {
  const iconRef = useRef<HTMLDivElement>(null)
  const iconRect = iconRef.current?.getBoundingClientRect()

  const refreshActiveItem = useRefreshActiveItem()

  const setDialogPrompt = useModalDialogPrompt()

  const chainReference = IsPromptVersion(version) ? version.usedInChain : null

  const [setPopup, setPopupProps, setPopupLocation] = useGlobalPopup<VersionPopupProps>()

  const deleteVersion = async () => {
    setPopup(undefined)
    if (version.usedAsEndpoint || chainReference) {
      const reason = version.usedAsEndpoint ? `published as an endpoint` : `used in chain “${chainReference}”`
      setDialogPrompt({
        title: `Cannot delete version because it is ${reason}.`,
        confirmTitle: 'OK',
        cancellable: false,
      })
    } else {
      setDialogPrompt({
        title: `Are you sure you want to delete this version? This action cannot be undone.`,
        callback: () => api.deleteVersion(version.id).then(_ => refreshActiveItem()),
        destructive: true,
      })
    }
  }

  const togglePopup = () => {
    setPopup(VersionPopup)
    setPopupProps({ deleteVersion })
    setPopupLocation({ left: (iconRect?.right ?? 0) - 160, top: iconRect?.bottom })
  }

  return (
    <div ref={iconRef}>
      <IconButton icon={dotsIcon} onClick={togglePopup} />
    </div>
  )
}

type VersionPopupProps = { deleteVersion: () => void }

function VersionPopup({ deleteVersion }: VersionPopupProps) {
  return (
    <PopupContent className='w-40'>
      <PopupMenuItem destructive title='Delete' callback={deleteVersion}  first last />
    </PopupContent>
  )
}
