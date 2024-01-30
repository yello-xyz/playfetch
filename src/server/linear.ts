import { getProviderCredentials } from './datastore/providers'
import { LinearClient } from '@linear/sdk'
import { ChainRoute, PromptRoute } from '../common/clientRoute'
import { getTrustedPromptOrChainData } from './datastore/chains'
import buildURLForRoute from './routing'
import { getUserForID } from './datastore/users'
import { getPendingTaskIdentifiersForVersion, saveNewTask } from './datastore/tasks'
import { IsRawPromptVersion, RawChainVersion, RawPromptVersion } from '@/types'

type Config = [string[], string[]]

const getUserClient = async (userID: number) => {
  const { apiKey: accessToken } = await getProviderCredentials([userID], 'linear')
  return accessToken ? new LinearClient({ accessToken }) : null
}

export async function getActorForID(userID: number, actorID: string) {
  const client = await getUserClient(userID)
  if (client) {
    const actor = await client.user(actorID)
    return { email: actor.email, name: actor.name }
  }
  return { email: null, name: null }
}

export async function getActorEmailForIssueState(userID: number, issueID: string, stateID: string) {
  const client = await getUserClient(userID)
  if (client) {
    const issue = await client.issue(issueID)
    const issueHistory = await issue.history()
    const action = issueHistory.nodes.find(state => state.toStateId === stateID)
    if (action?.actorId) {
      const actor = await client.user(action.actorId)
      return actor.email
    }
  }
  return null
}

export async function createTasksOnAddingLabel(
  userID: number,
  projectID: number,
  version: RawPromptVersion | RawChainVersion,
  label: string
) {
  const { environment } = await getProviderCredentials([projectID], 'linear')
  if (environment) {
    const configs = JSON.parse(environment) as Config[]
    for (const [triggers, toggles] of configs) {
      if (triggers.includes(label)) {
        const client = await getUserClient(userID)
        if (client) {
          const parentID = version.parentID
          const isPrompt = IsRawPromptVersion(version)
          const parentData = await getTrustedPromptOrChainData(parentID)
          const user = await getUserForID(userID)
          const url = buildURLForRoute(isPrompt ? PromptRoute(projectID, parentID) : ChainRoute(projectID, parentID))
          const labels = await client.issueLabels()
          const labelID = labels.nodes.find(l => l.name === label)?.id
          const teams = await client.teams()
          const team = teams.nodes[0]
          if (team?.id) {
            const issue = await client.createIssue({
              teamId: team.id,
              title: `PlayFetch • ${parentData.name}`,
              description: `**${user.fullName}** added label **“${label}”** to [${parentData.name}](${url}).`,
              labelIds: labelID ? [labelID] : undefined,
            })
            const createdIssue = await issue.issue
            if (issue.success && createdIssue?.id) {
              await saveNewTask(userID, projectID, parentID, version.id, createdIssue.id, toggles)
            }
          }
        }
        break
      }
    }
  }
}

export async function syncTaskComments(userID: number, versionID: number, comment: string, createdAt: Date) {
  const identifiers = await getPendingTaskIdentifiersForVersion(versionID)
  if (identifiers.length > 0) {
    const client = await getUserClient(userID)
    if (client) {
      for (const identifier of identifiers) {
        await client.createComment({ issueId: identifier, body: comment, createdAt })
      }
    }
  }
}
