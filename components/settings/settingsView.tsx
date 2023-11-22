import { DefaultProvider } from '@/src/common/defaultConfig'
import { ModelProviders, QueryProviders } from '@/src/common/providerMetadata'
import ProviderSettings from './providerSettings'
import CustomModelSettings from './customModelSettings'
import { AvailableProvider, CostUsage, IsModelProvider } from '@/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SidebarButton } from '../sidebar'
import SettingsPane from './settingsPane'
import api from '@/src/client/api'
import UsageSettings from './usageSettings'

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
      return 'Limit your API expenditure by setting a monthly spending limit. Please be aware that you remain accountable for any exceeding costs in case of delays in enforcing these limits.'
    case ConnectorsPane:
      return 'Provide your API credentials here to enable integration with vector stores.'
  }
}

const projectScopeDescriptionForPane = (pane: ActivePane) => {
  switch (pane) {
    case ProvidersPane:
    case CustomModelsPane:
    case ConnectorsPane:
      return 'Configurations made here will be available to anyone with project access to be used within the context of this project only.'
    case UsagePane:
      return undefined
  }
}

export default function SettingsView({
  scopeID,
  providers,
  showProjectScopeDescription,
  refresh,
}: {
  scopeID: number
  providers: AvailableProvider[]
  showProjectScopeDescription?: boolean
  refresh: () => void
}) {
  const [activePane, setActivePane] = useState<ActivePane>(ProvidersPane)

  const [costUsage, setCostUsage] = useState<CostUsage>()

  const refreshUsage = useCallback(() => api.getCostUsage(scopeID).then(setCostUsage), [scopeID])

  const didFetchCostUsage = useRef(false)
  useEffect(() => {
    if (!didFetchCostUsage.current) {
      didFetchCostUsage.current = true
      refreshUsage()
    }
  }, [refreshUsage])

  const availableModelProviders = providers.filter(IsModelProvider)
  const availableQueryProviders = providers.filter(provider => !IsModelProvider(provider))

  const allModelProviders = ModelProviders.filter(provider => provider !== DefaultProvider)
  const haveCustomModels = availableModelProviders.some(provider => provider.customModels.length > 0)

  return (
    <div className='flex h-full gap-10 p-10 overflow-hidden bg-gray-25'>
      <InnerSidebar activePane={activePane} setActivePane={setActivePane} haveCustomModels={haveCustomModels} />
      <div className='flex flex-col items-start flex-1 gap-3 text-gray-500 max-w-[680px] overflow-y-auto'>
        <SettingsPane
          title={titleForPane(activePane)}
          description={descriptionForPane(activePane)}
          scopeDescription={showProjectScopeDescription ? projectScopeDescriptionForPane(activePane) : undefined}>
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
          {activePane === UsagePane && !!costUsage && (
            <UsageSettings
              scopeID={scopeID}
              costUsage={costUsage}
              availableProviders={availableModelProviders}
              onRefresh={refreshUsage}
            />
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
