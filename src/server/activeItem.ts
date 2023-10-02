import { User } from '@/types'
import { getWorkspacesForUser } from './datastore/workspaces'
import { getActiveProject } from './datastore/projects'
import { ActiveItem, BuildActiveChain, BuildActivePrompt, CompareItem, EndpointsItem } from '../common/activeItem'
import { getPromptForUser } from './datastore/prompts'
import { getChainForUser } from './datastore/chains'
import { getAvailableProvidersForUser } from './datastore/providers'
import { ParsedUrlQuery } from 'querystring'
import { ParseActiveItemQuery, ParseNumberQuery } from '../client/clientRoute'
import { getAnalyticsForProject } from './datastore/analytics'

export default async function loadActiveItem(user: User, query: ParsedUrlQuery) {
  const { projectID } = ParseNumberQuery(query)

  const workspaces = await getWorkspacesForUser(user.id)

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

  const initialAnalytics =
    initialActiveItem === EndpointsItem ? await getAnalyticsForProject(user.id, projectID!, true) : null
  const availableProviders = await getAvailableProvidersForUser(user.id)

  return {
    user,
    workspaces,
    initialActiveProject,
    initialActiveItem,
    initialAnalytics,
    availableProviders,
  }
}
