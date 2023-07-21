import {
  Entity,
  buildKey,
  getDatastore,
  getEntities,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
} from './datastore'
import { saveVersionForUser, toVersion } from './versions'
import { toEndpoint } from './endpoints'
import { ActivePrompt, Endpoint, Prompt, ResolvedPromptEndpoint } from '@/types'
import { ensureProjectAccess, getProjectUsers, updateProjectLastEditedAt } from './projects'
import { getProjectInputValues } from './inputs'
import { toUsage } from './usage'

export async function migratePrompts() {
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await updatePrompt({ ...promptData }, false)
  }
}

const toPromptData = (
  projectID: number,
  name: string,
  lastVersionID: number,
  createdAt: Date,
  lastEditedAt: Date,
  promptID?: number
) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { projectID, lastVersionID, name, createdAt, lastEditedAt },
  excludeFromIndexes: ['name'],
})

export const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  lastVersionID: data.lastVersionID,
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt'),
})

export async function loadEndpoints(parentID: number, projectData: any, buildURL: (path: string) => string) {
  const endpoints = await getOrderedEntities(Entity.ENDPOINT, 'parentID', parentID)
  const usages = await getEntities(Entity.USAGE, 'parentID', parentID)

  return endpoints
    .map(endpoint => ({
      ...toEndpoint(endpoint),
      url: buildURL(`/p/${endpoint.projectURLPath}/${endpoint.urlPath}`),
      apiKeyDev: projectData.apiKeyDev ?? '',
      usage: toUsage(usages.find(usage => getID(usage) === getID(endpoint))),
    }))
    .reverse()
}

export async function getActivePrompt(
  userID: number,
  promptID: number,
  buildURL: (path: string) => string
): Promise<ActivePrompt> {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  const projectData = await getKeyedEntity(Entity.PROJECT, promptData.projectID)
  const versions = await getOrderedEntities(Entity.VERSION, 'promptID', promptID)
  const runs = await getOrderedEntities(Entity.RUN, 'promptID', promptID)
  const users = await getProjectUsers(promptData.projectID)
  const inputValues = await getProjectInputValues(promptData.projectID)
  const endpoints = await loadEndpoints(promptID, projectData, buildURL)
  const comments = await getOrderedEntities(Entity.COMMENT, 'promptID', promptID)

  return {
    ...toPrompt(promptData),
    versions: versions.map(version => toVersion(version, runs, comments)).reverse(),
    endpoints: endpoints as ResolvedPromptEndpoint[],
    users,
    inputValues,
    projectURLPath: projectData.urlPath ?? '',
    availableLabels: JSON.parse(projectData.labels),
    availableFlavors: JSON.parse(projectData.flavors),
  }
}

export const DefaultPromptName = 'New Prompt'

export async function addPromptForUser(userID: number, projectID: number): Promise<number> {
  await ensureProjectAccess(userID, projectID)
  const createdAt = new Date()
  const promptData = toPromptData(projectID, DefaultPromptName, 0, createdAt, createdAt)
  await getDatastore().save(promptData)
  await saveVersionForUser(userID, getID(promptData))
  await updateProjectLastEditedAt(projectID)
  return getID(promptData)
}

export async function updatePrompt(promptData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toPromptData(
      promptData.projectID,
      promptData.name,
      promptData.lastVersionID,
      promptData.createdAt,
      updateLastEditedTimestamp ? new Date() : promptData.lastEditedAt,
      getID(promptData)
    )
  )
  if (updateLastEditedTimestamp) {
    await updateProjectLastEditedAt(promptData.projectID)
  }
}

export const getVerifiedProjectScopedData = async (userID: number, entity: Entity, id: number) => {
  const data = await getKeyedEntity(entity, id)
  if (!data) {
    throw new Error(`Entity with ID ${id} does not exist or user has no access`)
  }
  await ensureProjectAccess(userID, data.projectID)
  return data
}

export const getVerifiedUserPromptData = async (userID: number, promptID: number) =>
  getVerifiedProjectScopedData(userID, Entity.PROMPT, promptID)

export async function ensurePromptAccess(userID: number, promptID: number) {
  await getVerifiedUserPromptData(userID, promptID)
}

export async function updatePromptName(userID: number, promptID: number, name: string) {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  await updatePrompt({ ...promptData, name }, true)
}

export async function deletePromptForUser(userID: number, promptID: number) {
  // TODO warn or even refuse when prompt has published endpoints or is used in chain.
  await ensurePromptAccess(userID, promptID)
  const versionKeys = await getEntityKeys(Entity.VERSION, 'promptID', promptID)
  const endpointKeys = await getEntityKeys(Entity.ENDPOINT, 'parentID', promptID)
  const usageKeys = await getEntityKeys(Entity.USAGE, 'parentID', promptID)
  const runKeys = await getEntityKeys(Entity.RUN, 'promptID', promptID)
  const commentKeys = await getEntityKeys(Entity.COMMENT, 'promptID', promptID)
  await getDatastore().delete([
    ...commentKeys,
    ...runKeys,
    ...usageKeys,
    ...endpointKeys,
    ...versionKeys,
    buildKey(Entity.PROMPT, promptID),
  ])
}
