import { AvailableProvider, IssueTrackerProvider, SourceControlProvider } from '@/types'
import { ReactNode, useState } from 'react'
import api from '@/src/client/api'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'
import Button from '../button'
import { ProviderRow } from './providerSettings'
import Link from 'next/link'
import { UserSettingsRoute } from '@/src/common/clientRoute'
import { LabelForProvider } from '@/src/common/providerMetadata'

export default function AppSettings({
  provider,
  scope,
  scopeID,
  scopedProvider,
  availableProvider,
  onRefresh,
  getEnvironment,
  userConfiguration,
  projectConfiguration,
}: {
  provider: SourceControlProvider | IssueTrackerProvider
  scope: 'user' | 'project'
  scopeID: number
  scopedProvider?: AvailableProvider
  availableProvider?: AvailableProvider
  onRefresh: () => void
  getEnvironment: () => string
  userConfiguration: () => ReactNode
  projectConfiguration: (isConfigured: boolean, isUpdating: boolean, isProcessing: boolean) => ReactNode
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
  const isProjectScope = scope === 'project'

  return (
    <>
      {!isProjectScope || availableProvider ? (
        <ProviderRow
          provider={provider}
          flexLayout={(scopedProvider && isProjectScope) || isUpdating ? 'flex-col' : 'justify-between'}>
          {isProjectScope ? (
            <div className='flex items-center gap-2.5'>
              {projectConfiguration(isProviderAvailable, isUpdating, isProcessing)}
              <div className='flex gap-2.5 justify-end grow cursor-pointer'>
                {isUpdating ? (
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
                )}
              </div>
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
