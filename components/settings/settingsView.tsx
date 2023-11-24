import { DefaultProvider } from '@/src/common/defaultConfig'
import { ModelProviders, QueryProviders } from '@/src/common/providerMetadata'
import ProviderSettings from './providerSettings'
import { ActiveProject, AvailableProvider, CostUsage, IsModelProvider } from '@/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import SettingsPane from './settingsPane'
import api from '@/src/client/api'
import UsageSettings from './usageSettings'
import { useLoggedInUser } from '@/src/client/context/userContext'
import SettingsSidebar from './settingsSidebar'
import TeamSettings from './teamSettings'

const ProvidersPane = 'providers'
const UsagePane = 'usage'
const TeamPane = 'team'
const ConnectorsPane = 'connectors'
type ActivePane = typeof ProvidersPane | typeof UsagePane | typeof TeamPane | typeof ConnectorsPane

const titleForPane = (pane: ActivePane) => {
  switch (pane) {
    case ProvidersPane:
      return 'LLM providers'
    case UsagePane:
      return 'Usage limits'
    case TeamPane:
      return 'Team'
    case ConnectorsPane:
      return 'Connectors'
  }
}

const descriptionForPane = (pane: ActivePane, isProjectScope: boolean) => {
  switch (pane) {
    case ProvidersPane:
      return 'Provide your API credentials here to enable integration with LLM providers. To get started, you’ll need to sign up for an account and get an API key from them.'
    case UsagePane:
      return (
        'Limit your API expenditure by setting a monthly spending limit. ' +
        (isProjectScope ? 'Notification emails will be dispatched to project members with the “Owner” role. ' : '') +
        'Please be aware that you remain accountable for any exceeding costs in case of delays in enforcing the limits.'
      )
    case TeamPane:
      return 'Manage who has access to this project, change role assignment and remove members.'
    case ConnectorsPane:
      return 'Provide your API credentials here to enable integration with vector stores.'
  }
}

const scopeDescriptionForPane = (pane: ActivePane, isProjectScope: boolean) => {
  switch (pane) {
    case ProvidersPane:
    case ConnectorsPane:
      return isProjectScope
        ? 'Configurations made here will be available to anyone with project access to be used within the context of this project only.'
        : undefined
    case UsagePane:
    case TeamPane:
      return undefined
  }
}

export default function SettingsView({
  activeProject,
  providers,
  refresh,
}: {
  activeProject?: ActiveProject
  providers: AvailableProvider[]
  refresh: () => void
}) {
  const user = useLoggedInUser()
  const isProjectScope = !!activeProject
  const scopeID = isProjectScope ? activeProject.id : user.id
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
  const availablePanes = [ProvidersPane, UsagePane, ...(isProjectScope ? [TeamPane] : []), ConnectorsPane]

  return !isProjectScope || activeProject.isOwner ? (
    <div className='flex h-full gap-10 p-10 overflow-hidden bg-gray-25'>
      <SettingsSidebar
        panes={availablePanes as ActivePane[]}
        activePane={activePane}
        setActivePane={setActivePane}
        titleForPane={titleForPane}
      />
      <div className='flex flex-col items-start flex-1 gap-3 text-gray-500 max-w-[680px] overflow-y-auto'>
        <SettingsPane
          title={titleForPane(activePane)}
          description={descriptionForPane(activePane, isProjectScope)}
          scopeDescription={scopeDescriptionForPane(activePane, isProjectScope)}>
          {activePane === ProvidersPane && (
            <ProviderSettings
              scopeID={scopeID}
              providers={allModelProviders}
              availableProviders={availableModelProviders}
              onRefresh={refresh}
            />
          )}
          {activePane === UsagePane && !!costUsage && (
            <UsageSettings
              scopeID={scopeID}
              costUsage={costUsage}
              availableProviders={availableModelProviders}
              onRefresh={refreshUsage}
            />
          )}
          {activePane === TeamPane && isProjectScope && <TeamSettings activeProject={activeProject} />}
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
  ) : null
}
