import api from '@/src/client/api'
import Button from '../button'
import { ProviderRow } from './providerSettings'
import { useRouter } from 'next/router'

export default function LinearSettings({ scope }: { scope: 'user' | 'project' }) {
  const router = useRouter()

  return (
    <>
      <ProviderRow provider='linear'>
        <Button type='secondary' onClick={() => api.authorizeLinear().then(router.push)}>
          Authorize
        </Button>
      </ProviderRow>
    </>
  )
}
