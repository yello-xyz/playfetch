import { ActiveChain, ActivePrompt, ChainVersion, IsPromptVersion, PromptVersion } from '@/types'
import api from '@/src/client/api'
import { PopupContent, PopupMenuItem } from '../components/popupMenu'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import dotsIcon from '@/public/dots.svg'
import { useRefreshActiveItem } from '@/src/client/context/projectContext'
import GlobalPopupMenu from '../components/globalPopupMenu'
import { useRouter } from 'next/router'
import { CompareRoute, NewEndpointRoute, ParseNumberQuery } from '@/src/common/clientRoute'
import { WithDismiss } from '@/src/client/context/globalPopupContext'
import { useState } from 'react'
import PickNameDialog from '../components/pickNameDialog'
import { useIssueTrackerProvider, useSourceControlProvider } from '@/src/client/context/providerContext'

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
  const [showExportPrompt, setShowExportPrompt] = useState(false)
  const [showTaskPrompt, setShowTaskPrompt] = useState(false)

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
  const sourceControlProvider = useSourceControlProvider()
  const exportVersion =
    IsPromptVersion(version) && sourceControlProvider?.scopeID === projectID
      ? () => setShowExportPrompt(true)
      : undefined

  const issueTrackerProvider = useIssueTrackerProvider()
  const createTask = issueTrackerProvider?.scopeID === projectID ? () => setShowTaskPrompt(true) : undefined

  const loadPopup = (): [typeof VersionPopup, VersionPopupProps] => [
    VersionPopup,
    { deleteVersion, createEndpoint, compareVersion, exportVersion, createTask, suggestImprovement },
  ]

  return showExportPrompt ? (
    <PickNameDialog
      title='Pick File Name'
      confirmTitle='Export'
      label='File Name'
      initialName={(activeItem as ActivePrompt).sourcePath ?? `${activeItem.name}.yaml`}
      onConfirm={fileName => api.exportPrompt(projectID!, version.id, fileName).then(_ => refreshActiveItem())}
      onDismiss={() => setShowExportPrompt(false)}
    />
  ) : showTaskPrompt ? (
    <PickNameDialog
      title='Create Task'
      confirmTitle='Create'
      label='Title'
      initialName={`PlayFetch • ${activeItem.name}`}
      onConfirm={title =>
        api.createTask(projectID!, activeItem.id, version.id, title, '').then(_ => refreshActiveItem())
      }
      onDismiss={() => setShowTaskPrompt(false)}
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
  createTask?: () => void
  suggestImprovement?: () => void
}

function VersionPopup({
  deleteVersion,
  createEndpoint,
  compareVersion,
  exportVersion,
  createTask,
  suggestImprovement,
  withDismiss,
}: VersionPopupProps & WithDismiss) {
  return (
    <PopupContent className='w-44'>
      {compareVersion && <PopupMenuItem title='Compare' callback={withDismiss(compareVersion)} first />}
      <PopupMenuItem title='Create Endpoint' callback={withDismiss(createEndpoint)} first={!compareVersion} />
      {createTask && <PopupMenuItem title='Create Task' callback={withDismiss(createTask)} />}
      {exportVersion && <PopupMenuItem title='Export' callback={withDismiss(exportVersion)} />}
      {suggestImprovement && <PopupMenuItem title='Suggest Improvement' callback={withDismiss(suggestImprovement)} />}
      <PopupMenuItem destructive title='Delete' callback={withDismiss(deleteVersion)} last />
    </PopupContent>
  )
}
