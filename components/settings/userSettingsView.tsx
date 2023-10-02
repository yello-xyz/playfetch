import { useLoggedInUser } from '@/src/client/context/userContext'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllProviders, LabelForProvider } from '@/src/common/providerMetadata'
import { ModelProvider } from '@/types'
import { useState } from 'react'
import api from '@/src/client/api'
import ProviderSettingsPane from './providerSettingsPane'

export default function UserSettingsView() {
  const user = useLoggedInUser()

  const allProviders = AllProviders.sort((a, b) => LabelForProvider(a).localeCompare(LabelForProvider(b))).filter(
    provider => provider !== DefaultProvider
  )
  const [availableProviders, setAvailableProviders] = useState(user.availableProviders)

  const refresh = () => api.getAvailableProviders().then(setAvailableProviders)

  return (
    <div className='flex flex-col items-start flex-1 gap-3 p-6 text-gray-500 max-w-[680px]'>
      <ProviderSettingsPane providers={allProviders} availableProviders={availableProviders} onRefresh={refresh} />
    </div>
  )
}
