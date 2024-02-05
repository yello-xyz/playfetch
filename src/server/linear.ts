import { getProviderCredentials } from './datastore/providers'
import { IssueHistory, LinearClient } from '@linear/sdk'
import { ChainRoute, PromptRoute } from '../common/clientRoute'
import { getTrustedPromptOrChainData } from './datastore/chains'
import buildURLForRoute from './routing'
import { getUserForID } from './datastore/users'
import { getPendingTaskIdentifiersForVersion, saveNewTask } from './datastore/tasks'
import { IsRawPromptVersion, IssueTrackerConfig, RawChainVersion, RawPromptVersion, User } from '@/types'

const getClient = async (projectID: number) => {
  const { apiKey: accessToken } = await getProviderCredentials([projectID], 'linear')
  return accessToken ? new LinearClient({ accessToken }) : null
}

export async function getActorForID(projectID: number, actorID: string) {
  const client = await getClient(projectID)
  if (client) {
    const actor = await client.user(actorID)
    return { email: actor.email, name: actor.name }
  }
  return { email: null, name: null }
}

const getActorIDForIssueHistory = async (
  client: LinearClient,
  issueID: string,
  predicate: (state: IssueHistory) => boolean
) => {
  const issue = await client.issue(issueID)
  const issueHistory = await issue.history()
  const action = issueHistory.nodes.find(predicate)
  return action?.actorId ?? null
}

export const getActorIDForIssueState = async (projectID: number, issueID: string, stateID: string) => {
  const client = await getClient(projectID)
  return client ? getActorIDForIssueHistory(client, issueID, state => state.id === stateID) : null
}

export const getIssueLabels = async (
  projectID: number,
  issueID: string,
  addedLabelIDs: string[],
  removedLabelIDs: string[]
) => {
  const client = await getClient(projectID)
  if (client) {
    const actorID = await getActorIDForIssueHistory(client, issueID, state =>
      addedLabelIDs.length > 0
        ? (state.addedLabelIds ?? []).includes(addedLabelIDs[0])
        : (state.removedLabelIds ?? []).includes(removedLabelIDs[0])
    )
    const labels = await client.issueLabels()
    const getLabelNames = (ids: string[]) =>
      ids.map(id => labels.nodes.find(l => l.id === id)?.name).flatMap(name => (name ? [name] : []))
    const addedLabels = getLabelNames(addedLabelIDs)
    const removedLabels = getLabelNames(removedLabelIDs)
    return { actorID, addedLabels, removedLabels }
  }
  return { actorID: null, addedLabels: [], removedLabels: [] }
}

export async function createTasksOnAddingLabel(
  userID: number,
  projectID: number,
  version: RawPromptVersion | RawChainVersion,
  label: string
) {
  const { environment } = await getProviderCredentials([projectID], 'linear')
  if (environment) {
    const config = JSON.parse(environment) as IssueTrackerConfig
    if (config.labels.includes(label)) {
      const client = await getClient(projectID)
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
            ...getUserProps(user),
          })
          const createdIssue = await issue.issue
          if (issue.success && createdIssue?.id) {
            await saveNewTask(userID, projectID, parentID, version.id, createdIssue.id)
          }
        }
      }
    }
  }
}

const getUserProps = async (userOrUserID: number | User) => {
  const user = typeof userOrUserID === 'number' ? await getUserForID(userOrUserID) : userOrUserID
  return { createAsUser: user.fullName, displayIconUrl: user.imageURL }
}

export async function syncTaskComments(
  userID: number,
  projectID: number,
  versionID: number,
  comment: string,
  createdAt: Date
) {
  const identifiers = await getPendingTaskIdentifiersForVersion(versionID)
  if (identifiers.length > 0) {
    const client = await getClient(projectID)
    if (client) {
      for (const identifier of identifiers) {
        await client.createComment({
          issueId: identifier,
          body: comment,
          createdAt,
          ...getUserProps(userID),
        })
      }
    }
  }
}

export async function syncTaskLabel(projectID: number, versionID: number, label: string, checked: boolean) {
  const identifiers = await getPendingTaskIdentifiersForVersion(versionID)
  if (identifiers.length > 0) {
    const client = await getClient(projectID)
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
