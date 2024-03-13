import { Analytics, ResolvedEndpoint, User } from '@/types'
import { getWorkspacesForUser } from './datastore/workspaces'
import { getActiveProject } from './datastore/projects'
import {
  ActiveItem,
  BuildActiveChain,
  BuildActivePrompt,
  BuildActiveTable,
  CompareItem,
  EndpointsItem,
  SettingsItem,
} from '@/src/common/activeItem'
import { getPromptForUser } from './datastore/prompts'
import { getChainForUser } from './datastore/chains'
import { loadAvailableProviders, loadScopedProviders } from './datastore/providers'
import { ParsedUrlQuery } from 'querystring'
import { ParseActiveItemQuery, ParseNumberQuery, ParseQuery } from '@/src/common/clientRoute'
import { getAnalyticsForProject } from './datastore/analytics'
import { getPresetsForUser } from './datastore/users'
import { getTableForUser } from './datastore/tables'

export default async function loadActiveItem(user: User, query: ParsedUrlQuery) {
  const { projectID } = ParseNumberQuery(query)

  const [workspaces] = await getWorkspacesForUser(user.id)

  const initialActiveProject = await getActiveProject(user.id, projectID!)

  const { promptID, chainID, tableID, compare, endpoints, settings } = ParseActiveItemQuery(query, initialActiveProject)

  const initialActiveItem: ActiveItem | null = compare
    ? CompareItem
    : endpoints
      ? EndpointsItem
      : settings
        ? SettingsItem
        : promptID
          ? await getPromptForUser(user.id, promptID).then(BuildActivePrompt(initialActiveProject))
          : chainID
            ? await getChainForUser(user.id, chainID).then(BuildActiveChain(initialActiveProject))
            : tableID
              ? await getTableForUser(user.id, tableID).then(BuildActiveTable)
              : null

  const initialAvailableProviders = await loadAvailableProviders([projectID!, user.id])
  const initialScopedProviders = await loadScopedProviders(projectID!)
  const initialUserPresets = await getPresetsForUser(user.id)

  let initialAnalytics: Analytics | null =
    initialActiveItem === EndpointsItem || initialActiveItem === CompareItem
      ? analyticsFromQuery(query, initialActiveProject.endpoints) ??
        (await getAnalyticsForProject(user.id, projectID!, true))
      : null

  return {
    user,
    workspaces,
    initialActiveProject,
    initialActiveItem,
    initialAnalytics,
    initialAvailableProviders,
    initialScopedProviders,
    initialUserPresets,
  }
}

const analyticsFromQuery = (query: ParsedUrlQuery, endpoints: ResolvedEndpoint[]): Analytics | null => {
  const { ad: analyticsData } = ParseQuery(query)
  if (!analyticsData) {
    return null
  }
  const analytics = JSON.parse(analyticsData) as Analytics
  return {
    ...analytics,
    recentLogEntries: analytics.recentLogEntries.map(entry => ({
      ...entry,
      endpointID: endpoints[entry.endpointID].id,
      parentID: endpoints[entry.endpointID].parentID,
      versionID: endpoints[entry.endpointID].versionID,
      flavor: endpoints[entry.endpointID].flavor,
      urlPath: endpoints[entry.endpointID].urlPath,
      timestamp: new Date(entry.timestamp).getTime(),
    })),
    logEntryCursors: [null],
  }
}
