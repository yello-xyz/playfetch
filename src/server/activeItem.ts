import { Analytics, ResolvedEndpoint, User } from '@/types'
import { getWorkspacesForUser } from './datastore/workspaces'
import { getActiveProject } from './datastore/projects'
import {
  ActiveItem,
  BuildActiveChain,
  BuildActivePrompt,
  CompareItem,
  EndpointsItem,
  SettingsItem,
} from '../common/activeItem'
import { getPromptForUser } from './datastore/prompts'
import { getChainForUser } from './datastore/chains'
import { loadAvailableProviders, loadScopedProviders } from './datastore/providers'
import { ParsedUrlQuery } from 'querystring'
import { ParseActiveItemQuery, ParseNumberQuery, ParseQuery } from '../common/clientRoute'
import { getAnalyticsForProject } from './datastore/analytics'
import { getDefaultPromptConfigForUser } from './datastore/users'

export default async function loadActiveItem(user: User, query: ParsedUrlQuery) {
  const { projectID } = ParseNumberQuery(query)

  const [workspaces] = await getWorkspacesForUser(user.id)

  const initialActiveProject = await getActiveProject(user.id, projectID!)

  const { promptID, chainID, compare, endpoints, settings } = ParseActiveItemQuery(query, initialActiveProject)

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
            : null

  const initialAvailableProviders = await loadAvailableProviders([projectID!, user.id])
  const initialScopedProviders = await loadScopedProviders(projectID!)
  const initialPromptConfig = await getDefaultPromptConfigForUser(user.id)

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
    initialPromptConfig,
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
  }
}
