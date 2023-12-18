import { ActiveChain, ActivePrompt, ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import api from '@/src/client/api'
import { PopupContent, PopupMenuItem } from '../popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import dotsIcon from '@/public/dots.svg'
import { useRefreshActiveItem } from '@/src/client/context/projectContext'
import GlobalPopupMenu from '../globalPopupMenu'
import { useRouter } from 'next/router'
import { CompareRoute, NewEndpointRoute, ParseNumberQuery } from '@/src/common/clientRoute'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { useState } from 'react'
import PickNameDialog from '../pickNameDialog'

export default function VersionPopupMenu<Version extends PromptVersion | ChainVersion>({
  version,
  activeItem,
  selectedCell = false,
}: {
  version: Version
  activeItem: ActivePrompt | ActiveChain
  selectedCell?: boolean
}) {
  const refreshActiveItem = useRefreshActiveItem()

  const setDialogPrompt = useModalDialogPrompt()
  const [showPickNamePrompt, setShowPickNamePrompt] = useState(false)

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
  const currentVersion =
    (activeItem.versions as { didRun: boolean; id: number }[]).findLast(version => !version.didRun) ?? version
  const suggestImprovement =
    IsPromptVersion(version) && (activeItem as ActivePrompt).canSuggestImprovements
      ? () => api.suggestPrompt(activeItem.id, version.id, currentVersion.id).then(refreshActiveItem)
      : undefined
  const exportVersion = IsPromptVersion(version) ? () => setShowPickNamePrompt(true) : undefined

  const loadPopup = (): [typeof VersionPopup, VersionPopupProps] => [
    VersionPopup,
    { deleteVersion, createEndpoint, compareVersion, exportVersion, suggestImprovement },
  ]

  return showPickNamePrompt ? (
    <PickNameDialog
      title='Pick File Name'
      confirmTitle='Export'
      label='Name'
      initialName={(activeItem as ActivePrompt).sourcePath ?? `${activeItem.name}.yaml`}
      onConfirm={fileName => api.exportPrompt(projectID!, version.id, fileName).then(_ => refreshActiveItem())}
      onDismiss={() => setShowPickNamePrompt(false)}
    />
  ) : (
    <GlobalPopupMenu icon={dotsIcon} loadPopup={loadPopup} selectedCell={selectedCell} />
  )
}

type VersionPopupProps = {
  deleteVersion: () => void
  createEndpoint: () => void
  compareVersion?: () => void
  exportVersion?: () => void
  suggestImprovement?: () => void
}

function VersionPopup({
  deleteVersion,
  createEndpoint,
  compareVersion,
  exportVersion,
  suggestImprovement,
  withDismiss,
}: VersionPopupProps & WithDismiss) {
  return (
    <PopupContent className='w-44'>
      {compareVersion && <PopupMenuItem title='Compare' callback={withDismiss(compareVersion)} first />}
      <PopupMenuItem title='Create Endpoint' callback={withDismiss(createEndpoint)} first={!compareVersion} />
      {exportVersion && <PopupMenuItem title='Export' callback={withDismiss(exportVersion)} />}
      {suggestImprovement && <PopupMenuItem title='Suggest Improvement' callback={withDismiss(suggestImprovement)} />}
      <PopupMenuItem destructive title='Delete' callback={withDismiss(deleteVersion)} last />
    </PopupContent>
  )
}
