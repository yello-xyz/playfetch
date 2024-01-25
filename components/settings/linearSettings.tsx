import api from '@/src/client/api'
import Button from '../button'
import { ProviderRow } from './providerSettings'
import { useRouter } from 'next/router'
import { useIssueTrackerProvider } from '@/src/client/context/providerContext'
import Link from 'next/link'
import { UserSettingsRoute } from '@/src/common/clientRoute'

export default function LinearSettings({ scope }: { scope: 'user' | 'project' }) {
  const availableProvider = useIssueTrackerProvider()

  const router = useRouter()
  const isProjectScope = scope === 'project'

  return (
    <>
      {!isProjectScope || availableProvider ? (
        <ProviderRow provider='linear'>
          <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
            Authorize
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
