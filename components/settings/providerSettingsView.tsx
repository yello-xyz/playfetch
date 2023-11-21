import { DefaultProvider } from '@/src/common/defaultConfig'
import { ModelProviders, QueryProviders } from '@/src/common/providerMetadata'
import ProviderSettingsPane from './providerSettingsPane'
import CustomModelSettingsPane from './customModelSettingsPane'
import { AvailableProvider, IsModelProvider } from '@/types'

export default function ProviderSettingsView({
  scopeID,
  providers,
  description,
  refresh,
}: {
  scopeID: number
  providers: AvailableProvider[]
  description?: string
  refresh: () => void
}) {
  const availableModelProviders = providers.filter(IsModelProvider)
  const availableQueryProviders = providers.filter(provider => !IsModelProvider(provider))

  const allModelProviders = ModelProviders.filter(provider => provider !== DefaultProvider)
  const haveCustomModels = availableModelProviders.some(provider => provider.customModels.length > 0)

  return (
    <div className='flex flex-col items-center h-full overflow-y-auto bg-gray-25'>
      <div className='flex flex-col items-start flex-1 gap-3 p-6 text-gray-500 max-w-[680px]'>
        {description && <span>{description}</span>}
        <ProviderSettingsPane
          scopeID={scopeID}
          title='Manage API keys'
          description='Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign up for an account and get an API key from them.'
          providers={allModelProviders}
          availableProviders={availableModelProviders}
          onRefresh={refresh}
        />
        {haveCustomModels && (
          <CustomModelSettingsPane scopeID={scopeID} availableProviders={availableModelProviders} onRefresh={refresh} />
        )}
        <ProviderSettingsPane
          scopeID={scopeID}
          title='Manage Vector Store Credentials'
          description='Provide your API credentials here to enable integration with vector stores.'
          providers={QueryProviders}
          availableProviders={availableQueryProviders}
          includeEnvironment
          onRefresh={refresh}
        />
      </div>
    </div>
  )
}
