import { User } from '@/types'
import { getWorkspacesForUser } from './datastore/workspaces'
import { getActiveProject } from './datastore/projects'
import { ActiveItem, BuildActiveChain, BuildActivePrompt, CompareItem, EndpointsItem } from '../common/activeItem'
import { getPromptForUser } from './datastore/prompts'
import { getChainForUser } from './datastore/chains'
import { getLogEntriesForProject } from './datastore/logs'
import { getAvailableProvidersForUser } from './datastore/providers'
import { ParsedUrlQuery } from 'querystring'
import { IncomingHttpHeaders } from 'http'
import { urlBuilderFromHeaders } from './routing'
import { ParseActiveItemQuery, ParseNumberQuery } from '../client/clientRoute'

export default async function loadActiveItem(user: User, query: ParsedUrlQuery, headers: IncomingHttpHeaders) {
  const { projectID } = ParseNumberQuery(query)
  const buildURL = urlBuilderFromHeaders(headers)

  const workspaces = await getWorkspacesForUser(user.id)

  const initialActiveProject = await getActiveProject(user.id, projectID!, buildURL)

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

  const initialLogEntries =
    initialActiveItem === EndpointsItem ? await getLogEntriesForProject(user.id, projectID!) : null
  const availableProviders = await getAvailableProvidersForUser(user.id)

  return {
    user,
    workspaces,
    initialActiveProject,
    initialActiveItem,
    initialLogEntries,
    availableProviders,
  }
}
