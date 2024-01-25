import api from '@/src/client/api'
import Button from '../button'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import { AvailableIssueTrackerProvider, AvailableProvider } from '@/types'
import AppSettings from './appSettings'

export default function LinearSettings({
  scope,
  scopeID,
  provider,
  onRefresh,
}: {
  scope: 'user' | 'project'
  scopeID: number
  provider?: AvailableProvider
  onRefresh: () => void
}) {
  const router = useRouter()
  const availableProvider = useIssueTrackerProvider()
  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined

  return (
    <AppSettings
      provider='linear'
      scope={scope}
      scopeID={scopeID}
      scopedProvider={scopedProvider}
      availableProvider={availableProvider}
      onRefresh={onRefresh}
      getEnvironment={() => 'new labels'}
      userConfiguration={() => (
        <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
          {scopedProvider ? 'Reauthorize' : 'Authorize'}
        </Button>
      )}
      projectConfiguration={(isConfigured, isUpdating, isProcessing) => (
        <>
          {isConfigured && 'previous labels...'}
          {isUpdating && <>new labels...</>}
        </>
      )}
    />
  )
}
