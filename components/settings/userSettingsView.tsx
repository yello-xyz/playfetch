import { useLoggedInUser } from '@/src/client/context/userContext'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllModelProviders, LabelForProvider } from '@/src/common/providerMetadata'
import { useState } from 'react'
import api from '@/src/client/api'
import ProviderSettingsPane from './providerSettingsPane'
import CustomModelSettingsPane from './customModelSettingsPane'
import { IsModelProvider } from '@/types'

export default function UserSettingsView() {
  const user = useLoggedInUser()

  const allProviders = AllModelProviders.sort((a, b) => LabelForProvider(a).localeCompare(LabelForProvider(b))).filter(
    provider => provider !== DefaultProvider
  )
  const [availableProviders, setAvailableProviders] = useState(user.availableProviders.filter(IsModelProvider))

  const refresh = () =>
    api.getAvailableProviders().then(providers => setAvailableProviders(providers.filter(IsModelProvider)))

  const haveCustomModels = availableProviders.some(provider => provider.customModels.length > 0)

  return (
    <div className='flex flex-col items-start flex-1 gap-3 p-6 text-gray-500 max-w-[680px]'>
      <ProviderSettingsPane
        title='Manage API keys'
        description='Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign up for an account and get an API key from them.'
        providers={allProviders}
        availableProviders={availableProviders}
        onRefresh={refresh}
      />
      {haveCustomModels && <CustomModelSettingsPane availableProviders={availableProviders} onRefresh={refresh} />}
    </div>
  )
}
