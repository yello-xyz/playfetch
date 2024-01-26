import api from '@/src/client/api'
import Button from '../button'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import { ActiveProject, AvailableIssueTrackerProvider, AvailableProvider } from '@/types'
import AppSettings from './appSettings'
import { useState } from 'react'
import { DefaultLabels, NeedsUpdatesLabel } from '@/src/common/defaults'
import { ItemLabels } from '../versions/versionLabels'
import LabelPopupMenu, { AvailableLabelColorsForItem } from '../labelPopupMenu'

export default function LinearSettings({
  activeProject,
  scopeID,
  provider,
  onRefresh,
}: {
  activeProject?: ActiveProject
  scopeID: number
  provider?: AvailableProvider
  onRefresh: () => void
}) {
  const router = useRouter()
  const availableProvider = useIssueTrackerProvider()

  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined
  const scopedLabels: [[string[], string[]]] = scopedProvider?.environment
    ? JSON.parse(scopedProvider.environment)
    : [[DefaultLabels, [NeedsUpdatesLabel]]]

  const availableLabels = activeProject ? activeProject.availableLabels : []
  const labelColors = activeProject ? AvailableLabelColorsForItem(activeProject) : {}

  const [labels, setLabels] = useState(scopedLabels)

  return (
    <AppSettings
      provider='linear'
      activeProject={activeProject}
      scopeID={scopeID}
      scopedProvider={scopedProvider}
      availableProvider={availableProvider}
      onRefresh={onRefresh}
      getEnvironment={() => JSON.stringify(labels)}
      userConfiguration={() => (
        <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
          {scopedProvider ? 'Reauthorize' : 'Authorize'}
        </Button>
      )}
      projectConfiguration={(isConfigured, isUpdating, isProcessing) => (
        <>
          {isConfigured &&
            labels.map(([triggers, toggles], index) => (
              <div className='flex flex-col gap-1' key={index}>
                <span>Create task on adding label: {triggers.join(', ')}</span>
                <span>Toggle labels on closing task: {toggles.join(', ')}</span>
              </div>
            ))}
          {isUpdating &&
            labels.map(([triggers, toggles], index) => (
              <div className='grid items-start gap-y-1 grid-cols-[180px_minmax(120px,1fr)_40px]' key={index}>
                Create task on adding label:
                <ItemLabels labels={triggers} colors={labelColors} />
                <LabelPopupMenu
                  activeLabels={triggers}
                  availableLables={availableLabels}
                  labelColors={labelColors}
                  toggleLabel={() => {}}
                />
                Toggle labels on closing task:
                <ItemLabels labels={toggles} colors={labelColors} />
                <LabelPopupMenu
                  activeLabels={toggles}
                  availableLables={availableLabels}
                  labelColors={labelColors}
                  toggleLabel={() => {}}
                />
              </div>
            ))}
        </>
      )}
    />
  )
}
