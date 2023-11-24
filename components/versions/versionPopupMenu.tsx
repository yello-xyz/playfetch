import { ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import api from '@/src/client/api'
import { PopupContent, PopupMenuItem } from '../popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import dotsIcon from '@/public/dots.svg'
import { useRefreshActiveItem } from '@/src/client/context/projectContext'
import GlobalPopupMenu from '../globalPopupMenu'
import { useRouter } from 'next/router'
import { CompareRoute, NewEndpointRoute, ParseNumberQuery } from '@/src/common/clientRoute'
import { WithDismiss } from '@/src/client/context/globalPopupContext'

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
  const compareVersion = version.previousID
    ? () => router.push(CompareRoute(projectID!, version.parentID, version.id, version.previousID))
    : undefined

  const loadPopup = (): [typeof VersionPopup, VersionPopupProps] => [
    VersionPopup,
    { deleteVersion, createEndpoint, compareVersion },
  ]

  return <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} selectedCell={selectedCell} />
}

type VersionPopupProps = { deleteVersion: () => void; createEndpoint: () => void; compareVersion?: () => void }

function VersionPopup({ deleteVersion, createEndpoint, compareVersion, withDismiss }: VersionPopupProps & WithDismiss) {
  return (
    <PopupContent className='w-40'>
      {compareVersion && <PopupMenuItem title='Compare' callback={withDismiss(compareVersion)} first />}
      <PopupMenuItem title='Create Endpoint' callback={withDismiss(createEndpoint)} first={!compareVersion} />
      <PopupMenuItem destructive title='Delete' callback={withDismiss(deleteVersion)} last />
    </PopupContent>
  )
}
