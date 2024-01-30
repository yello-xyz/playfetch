import { getProviderCredentials } from './datastore/providers'
import { IssueHistory, LinearClient } from '@linear/sdk'
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

const getActorIDForIssueHistory = async (
  userID: number,
  issueID: string,
  predicate: (state: IssueHistory) => boolean
) => {
  const client = await getUserClient(userID)
  if (client) {
    const issue = await client.issue(issueID)
    const issueHistory = await issue.history()
    const action = issueHistory.nodes.find(predicate)
    if (action) {
      return action.actorId ?? null
    }
  }
  return null
}

export const getActorIDForIssueState = (userID: number, issueID: string, stateID: string) =>
  getActorIDForIssueHistory(userID, issueID, state => state.toStateId === stateID)

export const getActorIDForIssueLabelAdd = (userID: number, issueID: string, labelID: string) =>
  getActorIDForIssueHistory(userID, issueID, state => (state.addedLabelIds ?? []).includes(labelID))

export const getActorIDForIssueLabelRemove = (userID: number, issueID: string, labelID: string) =>
  getActorIDForIssueHistory(userID, issueID, state => (state.removedLabelIds ?? []).includes(labelID))

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

export async function syncTaskLabel(userID: number, versionID: number, label: string, checked: boolean) {
  const identifiers = await getPendingTaskIdentifiersForVersion(versionID)
  if (identifiers.length > 0) {
    const client = await getUserClient(userID)
    if (client) {
      const labels = await client.issueLabels()
      const labelID = labels.nodes.find(l => l.name === label)?.id
      if (labelID) {
        for (const identifier of identifiers) {
          const issue = await client.issue(identifier)
          if (issue.labelIds.includes(labelID) !== checked) {
            await client.updateIssue(identifier, {
              labelIds: checked ? [...issue.labelIds, labelID] : issue.labelIds.filter(id => id !== labelID),
            })
          }
        }
      }
    }
  }
}
