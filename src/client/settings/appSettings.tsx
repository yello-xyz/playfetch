import { ActiveProject, AvailableProvider, IssueTrackerProvider, SourceControlProvider } from '@/types'
import { ReactNode, useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/components/modalDialogContext'
import Button from '@/src/client/components/button'
import { ProviderRow } from './providerSettings'
import Link from 'next/link'
import { UserSettingsRoute } from '@/src/common/clientRoute'
import { LabelForProvider } from '@/src/common/providerMetadata'

export default function AppSettings({
  provider,
  activeProject,
  scopeID,
  scopedProvider,
  availableProvider,
  onRefresh,
  getEnvironment,
  userConfiguration,
  projectConfiguration,
}: {
  provider: SourceControlProvider | IssueTrackerProvider
  activeProject?: ActiveProject
  scopeID: number
  scopedProvider?: AvailableProvider
  availableProvider?: AvailableProvider
  onRefresh: () => void
  getEnvironment: () => string | undefined
  userConfiguration: () => ReactNode
  projectConfiguration: (
    isConfigured: boolean,
    isUpdating: boolean,
    isProcessing: boolean,
    confirmButton: () => ReactNode
  ) => ReactNode
}) {
  const [isUpdating, setUpdating] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  const updateEnvironment = async (environment?: string) => {
    setProcessing(true)
    await api.updateProviderKey(scopeID, provider, null, environment).then(onRefresh)
    setProcessing(false)
    setUpdating(false)
  }

  const label = LabelForProvider(provider)

  const setDialogPrompt = useModalDialogPrompt()
  const resetEnvironment = () => {
    setDialogPrompt({
      title: `Are you sure you want to reset your ${label} integration?`,
      callback: () => updateEnvironment(),
      destructive: true,
    })
  }

  const isProviderAvailable = !!scopedProvider && !isUpdating

  return (
    <>
      {!activeProject || availableProvider ? (
        <ProviderRow
          provider={provider}
          flexLayout={(scopedProvider && activeProject) || isUpdating ? 'flex-col' : 'justify-between'}>
          {activeProject ? (
            <div className='flex gap-2.5'>
              {projectConfiguration(isProviderAvailable, isUpdating, isProcessing, () =>
                isUpdating ? (
                  <Button type='primary' disabled={isProcessing} onClick={() => updateEnvironment(getEnvironment())}>
                    Confirm
                  </Button>
                ) : scopedProvider ? (
                  <Button type='destructive' disabled={isProcessing} onClick={resetEnvironment}>
                    Reset
                  </Button>
                ) : (
                  <Button type='outline' onClick={() => setUpdating(!isUpdating)}>
                    Configure
                  </Button>
                )
              )}
            </div>
          ) : (
            userConfiguration()
          )}
        </ProviderRow>
      ) : (
        <div>
          Start by {provider === 'github' ? 'installing' : 'authorizing'} the {label} App in your{' '}
          <Link
            href={UserSettingsRoute(provider === 'github' ? 'sourceControl' : 'issueTracker')}
            className='underline'>
            Account Settings
          </Link>
          .
        </div>
      )}
    </>
  )
}
