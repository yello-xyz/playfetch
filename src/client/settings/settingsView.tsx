import { DefaultProvider } from '@/src/common/defaults'
import { ModelProviders, QueryProviders } from '@/src/common/providerMetadata'
import ProviderSettings from './providerSettings'
import { ActiveProject, ActiveWorkspace, AvailableProvider, CostUsage, IsModelProvider } from '@/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import SettingsPane from './settingsPane'
import api from '@/src/client/api'
import UsageSettings from './usageSettings'
import { useLoggedInUser } from '@/src/client/users/userContext'
import SettingsSidebar from './settingsSidebar'
import TeamSettings from './teamSettings'
import {
  ParseActiveSettingsPaneQuery,
  ProjectSettingsRoute,
  UserSettingsRoute,
  WorkspaceSettingsRoute,
} from '@/src/common/clientRoute'
import { useRouter } from 'next/router'
import GitHubSettings from './githubSettings'
import LinearSettings from './linearSettings'
import {
  ActiveSettingsPane,
  ConnectorsPane,
  DescriptionForSettingsPane,
  IssueTrackerPane,
  ProvidersPane,
  ScopeDescriptionForSettingsPane,
  SourceControlPane,
  TeamPane,
  TitleForSettingsPane,
  UsagePane,
} from './activeSettingsPane'

export default function SettingsView({
  providers,
  activeWorkspace,
  activeProject,
  refresh,
}: {
  providers: AvailableProvider[]
  activeWorkspace?: ActiveWorkspace
  activeProject?: ActiveProject
  refresh: () => void
}) {
  const user = useLoggedInUser()
  const scope = activeWorkspace ? 'workspace' : activeProject ? 'project' : 'user'
  const scopeID = activeWorkspace?.id ?? activeProject?.id ?? user.id

  const router = useRouter()
  const activePaneFromQuery = ParseActiveSettingsPaneQuery(router.query)
  const [activePane, setActivePane] = useState<ActiveSettingsPane>(activePaneFromQuery)

  if (activePaneFromQuery !== activePane) {
    setActivePane(activePaneFromQuery)
  }

  const updateActivePane = (pane: ActiveSettingsPane) => {
    if (pane !== activePane) {
      router.push(
        activeWorkspace
          ? WorkspaceSettingsRoute(scopeID, user.id, pane)
          : activeProject
          ? ProjectSettingsRoute(scopeID, pane)
          : UserSettingsRoute(pane),
        undefined,
        {
          shallow: true,
        }
      )
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
  const allModelProviders = ModelProviders.filter(provider => provider !== DefaultProvider)
  const availablePanes = [
    ProvidersPane,
    UsagePane,
    ...(activeWorkspace || activeProject ? [TeamPane] : []),
    ConnectorsPane,
    ...(activeWorkspace ? [] : [SourceControlPane]),
    ...(activeWorkspace ? [] : [IssueTrackerPane]),
  ]

  return activeWorkspace?.owners?.length || activeProject?.isOwner || (!activeWorkspace && !activeProject) ? (
    <div className='flex h-full gap-10 p-8 overflow-hidden bg-gray-25'>
      <SettingsSidebar
        panes={availablePanes as ActiveSettingsPane[]}
        activePane={activePane}
        setActivePane={updateActivePane}
        titleForPane={TitleForSettingsPane}
      />
      <div className='flex flex-col items-start flex-1 gap-3 text-gray-500 max-w-[680px] overflow-y-auto'>
        <SettingsPane
          title={TitleForSettingsPane(activePane)}
          description={DescriptionForSettingsPane(activePane, scope)}
          scopeDescription={ScopeDescriptionForSettingsPane(activePane, scope)}>
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
            <GitHubSettings
              activeProject={activeProject}
              scopeID={scopeID}
              provider={providers.find(provider => provider.provider === 'github')}
              onRefresh={refresh}
            />
          )}
          {activePane === IssueTrackerPane && (
            <LinearSettings
              activeProject={activeProject}
              scopeID={scopeID}
              provider={providers.find(provider => provider.provider === 'linear')}
              onRefresh={refresh}
            />
          )}
        </SettingsPane>
      </div>
    </div>
  ) : null
}
