import { ActiveChain, ActivePrompt, User } from '@/types'
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
  compareTool: boolean,
  endpoints: boolean,
  urlBuilder: (path: string) => string
) {
  const workspaces = await getWorkspacesForUser(user.id)

  const initialActiveProject = await getActiveProject(user.id, projectID!, urlBuilder)

  const getActivePrompt = async (promptID: number): Promise<ActivePrompt> =>
    getPromptForUser(user.id, promptID).then(BuildActivePrompt(initialActiveProject))

  const getActiveChain = async (chainID: number): Promise<ActiveChain> =>
    await getChainForUser(user.id, chainID).then(BuildActiveChain(initialActiveProject))

  const initialActiveItem: ActiveItem | null = compareTool
    ? CompareItem
    : endpoints
    ? EndpointsItem
    : promptID
    ? await getActivePrompt(promptID)
    : chainID
    ? await getActiveChain(chainID)
    : initialActiveProject.prompts.length > 0
    ? await getActivePrompt(initialActiveProject.prompts[0].id)
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
