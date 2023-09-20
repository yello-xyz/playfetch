import { User } from '@/types'
import { getWorkspacesForUser } from './datastore/workspaces'
import { getActiveProject } from './datastore/projects'
import { ActiveItem, BuildActiveChain, BuildActivePrompt, CompareItem, EndpointsItem } from '../common/activeItem'
import { getPromptForUser } from './datastore/prompts'
import { getChainForUser } from './datastore/chains'
import { getLogEntriesForProject } from './datastore/logs'
import { getAvailableProvidersForUser } from './datastore/providers'

export default async function loadActiveItem(
  user: User,
  projectID: number,
  promptID: number | undefined,
  chainID: number | undefined,
  compare: boolean,
  endpoints: boolean,
  urlBuilder: (path: string) => string
) {
  const workspaces = await getWorkspacesForUser(user.id)

  const initialActiveProject = await getActiveProject(user.id, projectID!, urlBuilder)

  if (!compare && !endpoints && !promptID && !chainID) {
    if (initialActiveProject.prompts.length > 0) {
      promptID = initialActiveProject.prompts[0].id
    } else {
      chainID = initialActiveProject.chains[0]?.id
    }
  }

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
