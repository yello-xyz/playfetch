import api from '@/src/client/api'
import Button from '../button'
import { ProviderRow } from './providerSettings'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import Link from 'next/link'
import { UserSettingsRoute } from '@/src/common/clientRoute'
import { AvailableIssueTrackerProvider, AvailableProvider } from '@/types'
import { useState } from 'react'
import useModalDialogPrompt from '@/src/client/context/modalDialogContext'

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
  const availableProvider = useIssueTrackerProvider()
  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined

  const [isUpdating, setUpdating] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  const updateEnvironment = async (environment?: string) => {
    setProcessing(true)
    await api.updateProviderKey(scopeID, 'linear', null, environment).then(onRefresh)
    setProcessing(false)
    setUpdating(false)
  }

  const setDialogPrompt = useModalDialogPrompt()
  const resetEnvironment = () => {
    setDialogPrompt({
      title: 'Are you sure you want to reset your GitHub integration?',
      callback: () => updateEnvironment(),
      destructive: true,
    })
  }

  const router = useRouter()
  const isProviderAvailable = scopedProvider && !isUpdating
  const isProjectScope = scope === 'project'

  return (
    <>
      {!isProjectScope || availableProvider ? (
        <ProviderRow
          provider='linear'
          flexLayout={(scopedProvider && isProjectScope) || isUpdating ? 'flex-col' : 'justify-between'}>
          {isProjectScope ? (
            <div className='flex items-center gap-2.5'>
              {isProviderAvailable && 'previous labels...'}
              {isUpdating && <>new labels...</>}
              <div className='flex gap-2.5 justify-end grow cursor-pointer'>
                {isUpdating ? (
                  <Button type='primary' disabled={isProcessing} onClick={() => updateEnvironment('new labels')}>
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
            <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
              {scopedProvider ? 'Reauthorize' : 'Authorize'}
            </Button>
          )}
        </ProviderRow>
      ) : (
        <div>
          Start by authorizing the Linear App in your{' '}
          <Link href={UserSettingsRoute('issueTracker')} className='underline'>
            Account Settings
          </Link>
          .
        </div>
      )}
    </>
  )
}
