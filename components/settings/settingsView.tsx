import { DefaultProvider } from '@/src/common/defaultConfig'
import { ModelProviders, QueryProviders } from '@/src/common/providerMetadata'
import ProviderSettings from './providerSettings'
import CustomModelSettings from './customModelSettings'
import { AvailableProvider, IsModelProvider, ModelCosts } from '@/types'
import { useEffect, useState } from 'react'
import { SidebarButton } from '../sidebar'
import SettingsPane from './settingsPane'
import api from '@/src/client/api'
import CostDashboard from './costDashboard'

const ProvidersPane = 'providers'
const CustomModelsPane = 'customModels'
const UsagePane = 'usage'
const ConnectorsPane = 'connectors'
type ActivePane = typeof ProvidersPane | typeof CustomModelsPane | typeof UsagePane | typeof ConnectorsPane

const titleForPane = (pane: ActivePane) => {
  switch (pane) {
    case ProvidersPane:
      return 'LLM providers'
    case CustomModelsPane:
      return 'Custom models'
    case UsagePane:
      return 'Usage limits'
    case ConnectorsPane:
      return 'Connectors'
  }
}

const descriptionForPane = (pane: ActivePane) => {
  switch (pane) {
    case ProvidersPane:
      return 'Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign up for an account and get an API key from them.'
    case CustomModelsPane:
      return 'Give each model you want to use a short unique name and optional description to enable it within the app.'
    case UsagePane:
      return 'Limit your API expenditure by setting monthly spending limits.'
    case ConnectorsPane:
      return 'Provide your API credentials here to enable integration with vector stores.'
  }
}

const shouldIncludeScopeDescriptionForPane = (pane: ActivePane) => {
  switch (pane) {
    case ProvidersPane:
    case CustomModelsPane:
    case ConnectorsPane:
      return true
    case UsagePane:
      return false
  }
}

export default function SettingsView({
  scopeID,
  providers,
  scopeDescription,
  refresh,
}: {
  scopeID: number
  providers: AvailableProvider[]
  scopeDescription?: string
  refresh: () => void
}) {
  const [activePane, setActivePane] = useState<ActivePane>(ProvidersPane)

  const [modelCosts, setModelCosts] = useState<ModelCosts[]>()

  useEffect(() => {
    if (!modelCosts) {
      setModelCosts([])
      api.getModelCosts(scopeID).then(setModelCosts)
    }
  }, [scopeID, modelCosts])

  const availableModelProviders = providers.filter(IsModelProvider)
  const availableQueryProviders = providers.filter(provider => !IsModelProvider(provider))

  const allModelProviders = ModelProviders.filter(provider => provider !== DefaultProvider)
  const haveCustomModels = availableModelProviders.some(provider => provider.customModels.length > 0)
  const haveModelCosts = !!modelCosts && modelCosts.length > 0

  return (
    <div className='flex h-full gap-10 px-10 pt-10 bg-gray-25'>
      <InnerSidebar activePane={activePane} setActivePane={setActivePane} haveCustomModels={haveCustomModels} />
      <div className='flex flex-col items-start flex-1 gap-3 text-gray-500 max-w-[680px] overflow-y-auto'>
        <SettingsPane
          title={titleForPane(activePane)}
          description={descriptionForPane(activePane)}
          scopeDescription={shouldIncludeScopeDescriptionForPane(activePane) ? scopeDescription : undefined}>
          {activePane === ProvidersPane && (
            <ProviderSettings
              scopeID={scopeID}
              providers={allModelProviders}
              availableProviders={availableModelProviders}
              onRefresh={refresh}
            />
          )}
          {activePane === CustomModelsPane && (
            <CustomModelSettings scopeID={scopeID} availableProviders={availableModelProviders} onRefresh={refresh} />
          )}
          {activePane === UsagePane && haveModelCosts && (
            <CostDashboard modelCosts={modelCosts!} availableProviders={availableModelProviders} />
          )}
          {activePane === ConnectorsPane && (
            <ProviderSettings
              scopeID={scopeID}
              providers={QueryProviders}
              availableProviders={availableQueryProviders}
              includeEnvironment
              onRefresh={refresh}
            />
          )}
        </SettingsPane>
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
}) => (
  <div className='flex flex-col min-w-[220px] overflow-y-auto'>
    <InnerSidebarItem pane={ProvidersPane} activePane={activePane} setActivePane={setActivePane} />
    {haveCustomModels && (
      <InnerSidebarItem pane={CustomModelsPane} activePane={activePane} setActivePane={setActivePane} />
    )}
    <InnerSidebarItem pane={UsagePane} activePane={activePane} setActivePane={setActivePane} />
    <InnerSidebarItem pane={ConnectorsPane} activePane={activePane} setActivePane={setActivePane} />
  </div>
)

const InnerSidebarItem = ({
  pane,
  activePane,
  setActivePane,
}: {
  pane: ActivePane
  activePane: ActivePane
  setActivePane: (pane: ActivePane) => void
}) => <SidebarButton title={titleForPane(pane)} active={pane === activePane} onClick={() => setActivePane(pane)} />
