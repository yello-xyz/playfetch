import { ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import api from '@/src/client/api'
import { PopupContent, PopupMenuItem } from './popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import dotsIcon from '@/public/dots.svg'
import { useRefreshActiveItem } from '@/src/client/context/refreshContext'
import GlobalPopupMenu from './globalPopupMenu'
import { useRouter } from 'next/router'
import { NewEndpointRoute, ParseNumberQuery } from '@/src/client/clientRoute'

export default function VersionPopupMenu<Version extends PromptVersion | ChainVersion>({
  version,
  selectedCell = false,
}: {
  version: Version
  selectedCell?: boolean
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

  const router = useRouter()
  const { projectID } = ParseNumberQuery(router.query)
  const createEndpoint = () => router.push(NewEndpointRoute(projectID!, version.parentID, version.id))

  const loadPopup = (): [typeof VersionPopup, VersionPopupProps] => [VersionPopup, { deleteVersion, createEndpoint }]

  return <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} selectedCell={selectedCell} />
}

type VersionPopupProps = { deleteVersion: () => void; createEndpoint: () => void; onDismissGlobalPopup?: () => void }

function VersionPopup({ deleteVersion, createEndpoint, onDismissGlobalPopup }: VersionPopupProps) {
  const dismissAndCallback = (callback: () => void) => () => {
    onDismissGlobalPopup?.()
    callback()
  }

  return (
    <PopupContent className='w-40'>
      <PopupMenuItem title='Create Endpoint' callback={dismissAndCallback(createEndpoint)} first />
      <PopupMenuItem destructive title='Delete' callback={dismissAndCallback(deleteVersion)} last />
    </PopupContent>
  )
}
