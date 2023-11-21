import { DefaultProvider } from '@/src/common/defaultConfig'
import { ModelProviders, QueryProviders } from '@/src/common/providerMetadata'
import ProviderSettingsPane from './providerSettingsPane'
import CustomModelSettingsPane from './customModelSettingsPane'
import { AvailableProvider, IsModelProvider } from '@/types'
import { useState } from 'react'
import { SidebarButton } from '../sidebar'

const ProvidersPane = 'providers'
const CustomModelsPane = 'customModels'
const ConnectorsPane = 'connectors'
type ActivePane = typeof ProvidersPane | typeof CustomModelsPane | typeof ConnectorsPane

export default function SettingsView({
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
  const [activePane, setActivePane] = useState<ActivePane>(ProvidersPane)

  const availableModelProviders = providers.filter(IsModelProvider)
  const availableQueryProviders = providers.filter(provider => !IsModelProvider(provider))

  const allModelProviders = ModelProviders.filter(provider => provider !== DefaultProvider)
  const haveCustomModels = availableModelProviders.some(provider => provider.customModels.length > 0)

  return (
    <div className='flex h-full gap-10 px-10 pt-10 bg-gray-25'>
      <InnerSidebar activePane={activePane} setActivePane={setActivePane} haveCustomModels={haveCustomModels} />
      <div className='flex flex-col items-start flex-1 gap-3 text-gray-500 max-w-[680px] overflow-y-auto'>
        {activePane === ProvidersPane && (
          <ProviderSettingsPane
            scopeID={scopeID}
            title='Manage API keys'
            description='Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign up for an account and get an API key from them.'
            providers={allModelProviders}
            availableProviders={availableModelProviders}
            onRefresh={refresh}
          />
        )}
        {activePane === CustomModelsPane && (
          <CustomModelSettingsPane scopeID={scopeID} availableProviders={availableModelProviders} onRefresh={refresh} />
        )}
        {activePane === ConnectorsPane && (
          <ProviderSettingsPane
            scopeID={scopeID}
            title='Manage Vector Store Credentials'
            description='Provide your API credentials here to enable integration with vector stores.'
            providers={QueryProviders}
            availableProviders={availableQueryProviders}
            includeEnvironment
            onRefresh={refresh}
          />
        )}
      </div>
    </div>
  )
}

const InnerSidebar = ({
  activePane,
  setActivePane,
  haveCustomModels,
}: {
  activePane: ActivePane
  setActivePane: (pane: ActivePane) => void
  haveCustomModels: boolean
}) => {
  return (
    <div className='flex flex-col min-w-[220px] overflow-y-auto'>
      <InnerSidebarItem
        title='LLM Providers'
        pane={ProvidersPane}
        activePane={activePane}
        setActivePane={setActivePane}
      />
      {haveCustomModels && (
        <InnerSidebarItem
          title='Custom Models'
          pane={CustomModelsPane}
          activePane={activePane}
          setActivePane={setActivePane}
        />
      )}
      <InnerSidebarItem
        title='Connectors'
        pane={ConnectorsPane}
        activePane={activePane}
        setActivePane={setActivePane}
      />
    </div>
  )
}

const InnerSidebarItem = ({
  title,
  pane,
  activePane,
  setActivePane,
}: {
  title: string
  pane: ActivePane
  activePane: ActivePane
  setActivePane: (pane: ActivePane) => void
}) => <SidebarButton title={title} active={pane === activePane} onClick={() => setActivePane(pane)} />
