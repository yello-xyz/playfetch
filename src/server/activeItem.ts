import { Analytics, Usage, User } from '@/types'
import { getWorkspacesForUser } from './datastore/workspaces'
import { getActiveProject } from './datastore/projects'
import { ActiveItem, BuildActiveChain, BuildActivePrompt, CompareItem, EndpointsItem } from '../common/activeItem'
import { getPromptForUser } from './datastore/prompts'
import { getChainForUser } from './datastore/chains'
import { getAvailableProvidersForUser } from './datastore/providers'
import { ParsedUrlQuery } from 'querystring'
import { ParseActiveItemQuery, ParseNumberQuery, ParseQuery } from '../common/clientRoute'
import { getAnalyticsForProject } from './datastore/analytics'

export default async function loadActiveItem(user: User, query: ParsedUrlQuery) {
  const { projectID } = ParseNumberQuery(query)

  const [workspaces] = await getWorkspacesForUser(user.id)

  const initialActiveProject = await getActiveProject(user.id, projectID!)

  const { promptID, chainID, compare, endpoints } = ParseActiveItemQuery(query, initialActiveProject)

  const initialActiveItem: ActiveItem | null = compare
    ? CompareItem
    : endpoints
    ? EndpointsItem
    : promptID
    ? await getPromptForUser(user.id, promptID).then(BuildActivePrompt(initialActiveProject))
    : chainID
    ? await getChainForUser(user.id, chainID).then(BuildActiveChain(initialActiveProject))
    : null

  const availableProviders = await getAvailableProvidersForUser(user.id)

  let initialAnalytics: Analytics | null =
    initialActiveItem === EndpointsItem || initialActiveItem === CompareItem
      ? await getAnalyticsForProject(user.id, projectID!, true)
      : null
  const { ud: usageData } = ParseQuery(query)
  if (initialAnalytics && usageData) {
    const usage: Usage[] = JSON.parse(usageData)
    initialAnalytics = {
      ...initialAnalytics,
      aggregatePreviousUsage: usage[0],
      recentUsage: usage.slice(1),
    }
  }

  return {
    user,
    workspaces,
    initialActiveProject,
    initialActiveItem,
    initialAnalytics,
    availableProviders,
  }
}
