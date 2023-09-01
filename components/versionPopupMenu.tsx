import { ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import api from '@/src/client/api'
import { PopupContent, PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import dotsIcon from '@/public/dots.svg'
import { useRefreshActiveItem } from '@/src/client/context/refreshContext'
import GlobalPopupMenu from './globalPopupMenu'

export default function VersionPopupMenu<Version extends PromptVersion | ChainVersion>({
  version,
}: {
  version: Version
}) {
  const refreshActiveItem = useRefreshActiveItem()

  const setDialogPrompt = useModalDialogPrompt()

  const chainReference = IsPromptVersion(version) ? version.usedInChain : null

  const deleteVersion = async () => {
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

  const loadPopup = (): [typeof VersionPopup, VersionPopupProps] => [VersionPopup, { deleteVersion }]

  return <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} />
}

type VersionPopupProps = { deleteVersion: () => void; onDismissGlobalPopup?: () => void }

function VersionPopup({ deleteVersion, onDismissGlobalPopup }: VersionPopupProps) {
  const callback = () => {
    onDismissGlobalPopup?.()
    deleteVersion()
  }

  return (
    <PopupContent className='w-40'>
      <PopupMenuItem destructive title='Delete' callback={callback} first last />
    </PopupContent>
  )
}
