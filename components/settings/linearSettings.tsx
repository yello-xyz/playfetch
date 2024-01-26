import api from '@/src/client/api'
import Button from '../button'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import { AvailableIssueTrackerProvider, AvailableProvider } from '@/types'
import AppSettings from './appSettings'
import { useState } from 'react'
import { DefaultLabels, NeedsUpdatesLabel } from '@/src/common/defaults'
import { ItemLabels } from '../versions/versionLabels'

export default function LinearSettings({
  scope,
  scopeID,
  provider,
  labelColors,
  onRefresh,
}: {
  scope: 'user' | 'project'
  scopeID: number
  provider?: AvailableProvider
  labelColors: Record<string, string>
  onRefresh: () => void
}) {
  const router = useRouter()
  const availableProvider = useIssueTrackerProvider()

  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined
  const scopedLabels: [[string[], string[]]] = scopedProvider?.environment
    ? JSON.parse(scopedProvider.environment)
    : [[DefaultLabels, [NeedsUpdatesLabel]]]

  const [labels, setLabels] = useState(scopedLabels)

  return (
    <AppSettings
      provider='linear'
      scope={scope}
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
                <div className='h-full border' />
                Toggle labels on closing task:
                <ItemLabels labels={toggles} colors={labelColors} />
                <div className='h-full border' />
              </div>
            ))}
        </>
      )}
    />
  )
}
