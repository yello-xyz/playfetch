import { useLoggedInUser } from '@/src/client/context/userContext'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AllModelProviders, AllQueryProviders } from '@/src/common/providerMetadata'
import { useState } from 'react'
import api from '@/src/client/api'
import ProviderSettingsPane from './providerSettingsPane'
import CustomModelSettingsPane from './customModelSettingsPane'
import { IsModelProvider } from '@/types'

export default function UserSettingsView() {
  const user = useLoggedInUser()

  const [availableProviders, setAvailableProviders] = useState(user.availableProviders)
  const availableModelProviders = availableProviders.filter(IsModelProvider)
  const availableQueryProviders = availableProviders.filter(provider => !IsModelProvider(provider))

  const refresh = () => api.getAvailableProviders().then(setAvailableProviders)

  const allModelProviders = AllModelProviders.filter(provider => provider !== DefaultProvider)
  const haveCustomModels = availableModelProviders.some(provider => provider.customModels.length > 0)

  return (
    <div className='flex flex-col items-start flex-1 gap-3 p-6 text-gray-500 max-w-[680px]'>
      <ProviderSettingsPane
        title='Manage API keys'
        description='Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign up for an account and get an API key from them.'
        providers={allModelProviders}
        availableProviders={availableModelProviders}
        onRefresh={refresh}
      />
      {haveCustomModels && <CustomModelSettingsPane availableProviders={availableModelProviders} onRefresh={refresh} />}
      <ProviderSettingsPane
        title='Manage Vector Store Credentials'
        description='Provide your API credentials here to enable integration with vector stores.'
        providers={AllQueryProviders}
        availableProviders={availableQueryProviders}
        includeEnvironment
        onRefresh={refresh}
      />
    </div>
  )
}
