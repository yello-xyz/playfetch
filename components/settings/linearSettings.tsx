import api from '@/src/client/api'
import Button from '../button'
import { ProviderRow } from './providerSettings'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import Link from 'next/link'
import { UserSettingsRoute } from '@/src/common/clientRoute'
import { AvailableIssueTrackerProvider, AvailableProvider } from '@/types'

export default function LinearSettings({
  scope,
  provider,
}: {
  scope: 'user' | 'project'
  provider?: AvailableProvider
}) {
  const availableProvider = useIssueTrackerProvider()
  const scopedProvider = provider as AvailableIssueTrackerProvider | undefined

  const router = useRouter()
  const isProjectScope = scope === 'project'

  return (
    <>
      {!isProjectScope || availableProvider ? (
        <ProviderRow provider='linear'>
          <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
            {scopedProvider ? 'Reauthorize' : 'Authorize'}
          </Button>
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
