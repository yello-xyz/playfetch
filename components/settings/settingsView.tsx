import { DefaultProvider } from '@/src/common/defaultConfig'
import { ModelProviders, QueryProviders, SourceControlProviders } from '@/src/common/providerMetadata'
import ProviderSettings from './providerSettings'
import { AvailableProvider, CostUsage, IsModelProvider } from '@/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import SettingsPane from './settingsPane'
import api from '@/src/client/api'
import UsageSettings from './usageSettings'
import { useLoggedInUser } from '@/src/client/context/userContext'
import SettingsSidebar from './settingsSidebar'
import TeamSettings from './teamSettings'
import { Capitalize } from '@/src/common/formatting'
import { useActiveProject } from '@/src/client/context/projectContext'
import { ParseActiveSettingsTabQuery, ProjectSettingsRoute, UserSettingsRoute } from '@/src/common/clientRoute'
import { useRouter } from 'next/router'

const ProvidersPane = 'providers'
const UsagePane = 'usage'
const TeamPane = 'team'
const ConnectorsPane = 'connectors'
const SourceControlPane = 'sourceControl'

type ActivePane =
  | typeof ProvidersPane
  | typeof UsagePane
  | typeof TeamPane
  | typeof ConnectorsPane
  | typeof SourceControlPane

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
    case SourceControlPane:
      return 'Source control'
  }
}

const descriptionForPane = (pane: ActivePane, isProjectScope: boolean) => {
  switch (pane) {
    case ProvidersPane:
      return (
        'Provide your API credentials here to enable integration with LLM providers' +
        (isProjectScope ? ' within this project. ' : '. ') +
        'To get started, you’ll need to sign up for an account and get an API key from them. ' +
        'All API keys are encrypted and stored securely.'
      )
    case UsagePane:
      return (
        'Limit your API expenditure by setting a monthly spending limit' +
        (isProjectScope
          ? ' for providers configured in this project. '
          : ' for providers that are not configured within the scope of a project. ') +
        (isProjectScope ? 'Notification emails will be dispatched to project members with the “Owner” role. ' : '') +
        'Please be aware that you remain accountable for any exceeding costs in case of delays in enforcing the limits.'
      )
    case TeamPane:
      return 'Manage who has access to this project, change role assignments or remove members.'
    case ConnectorsPane:
      return (
        'Provide your API credentials here to enable integration with vector stores' +
        (isProjectScope ? ' within this project. ' : '. ') +
        'All API keys are encrypted and stored securely.'
      )
    case SourceControlPane:
      return 'Synchronise prompt files between your PlayFetch project and your source control system.'
  }
}

const projectScopeDescription = (targetType: 'providers' | 'connectors') =>
  `${Capitalize(
    targetType
  )} configured here will be available to anyone with project access to be used within the context of this project only. Project members can still use their own API keys within this project for ${targetType} that are not configured here.`

const scopeDescriptionForPane = (pane: ActivePane, isProjectScope: boolean) => {
  switch (pane) {
    case ProvidersPane:
      return isProjectScope ? projectScopeDescription('providers') : undefined
    case ConnectorsPane:
      return isProjectScope ? projectScopeDescription('connectors') : undefined
    case UsagePane:
    case TeamPane:
    case SourceControlPane:
      return undefined
  }
}

export default function SettingsView({
  scope,
  providers,
  refresh,
}: {
  scope: 'user' | 'project'
  providers: AvailableProvider[]
  refresh: () => void
}) {
  const user = useLoggedInUser()
  const activeProject = useActiveProject()
  const isProjectScope = scope === 'project'
  const scopeID = isProjectScope ? activeProject.id : user.id

  const router = useRouter()
  const activePaneFromQuery = ParseActiveSettingsTabQuery(router.query)
  const [activePane, setActivePane] = useState<ActivePane>(activePaneFromQuery)
  const updateActivePane = (pane: ActivePane) => {
    if (pane !== activePane) {
      router.push(isProjectScope ? ProjectSettingsRoute(scopeID, pane) : UserSettingsRoute(pane), undefined, {
        shallow: true,
      })
      setActivePane(pane)
    }
  }

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
  const availableQueryProviders = providers.filter(
    provider => !IsModelProvider(provider) && (QueryProviders as string[]).includes(provider.provider)
  )
  const availableSourceControlProviders = providers.filter(
    provider => !IsModelProvider(provider) && (SourceControlProviders as string[]).includes(provider.provider)
  )

  const allModelProviders = ModelProviders.filter(provider => provider !== DefaultProvider)
  const availablePanes = [
    ProvidersPane,
    UsagePane,
    ...(isProjectScope ? [TeamPane, ConnectorsPane, SourceControlPane] : [ConnectorsPane]),
  ]

  return !isProjectScope || activeProject.isOwner ? (
    <div className='flex h-full gap-10 p-10 overflow-hidden bg-gray-25'>
      <SettingsSidebar
        panes={availablePanes as ActivePane[]}
        activePane={activePane}
        setActivePane={updateActivePane}
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
          {activePane === TeamPane && <TeamSettings />}
          {activePane === ConnectorsPane && (
            <ProviderSettings
              scopeID={scopeID}
              providers={QueryProviders}
              availableProviders={availableQueryProviders}
              includeEnvironment
              onRefresh={refresh}
            />
          )}
          {activePane === SourceControlPane && (
            <ProviderSettings
              scopeID={scopeID}
              providers={SourceControlProviders}
              availableProviders={availableSourceControlProviders}
              includeEnvironment
              excludeApiKey
              onRefresh={refresh}
            />
          )}
        </SettingsPane>
      </div>
    </div>
  ) : null
}
