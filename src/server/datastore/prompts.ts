import { StripPromptSentinels } from '@/src/common/formatting'
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
  toID,
} from './datastore'
import { saveVersionForUser, toVersion } from './versions'
import { toEndpoint } from './endpoints'
import { ActivePrompt, Prompt } from '@/types'
import { ensureProjectAccess, getProjectUsers } from './projects'
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
  prompt: string,
  createdAt: Date,
  lastEditedAt: Date,
  favorited: boolean,
  promptID?: number
) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { projectID, prompt, name, createdAt, lastEditedAt, favorited },
  excludeFromIndexes: ['name', 'prompt'],
})

export const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  prompt: StripPromptSentinels(data.prompt),
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt') ?? getTimestamp(data),
  favorited: data.favorited,
})

export async function getActivePrompt(
  userID: number,
  promptID: number,
  buildURL: (path: string) => string
): Promise<ActivePrompt> {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  const projectData =
    promptData.projectID === userID ? undefined : await getKeyedEntity(Entity.PROJECT, promptData.projectID)
  const endpoints = await getEntities(Entity.ENDPOINT, 'promptID', promptID)
  const usages = await getEntities(Entity.USAGE, 'promptID', promptID)
  const versions = await getOrderedEntities(Entity.VERSION, 'promptID', promptID)
  const runs = await getOrderedEntities(Entity.RUN, 'promptID', promptID)
  const users = await getProjectUsers(userID, promptData.projectID)
  const inputs = await getProjectInputValues(userID, promptData.projectID)

  return {
    ...toPrompt(promptData),
    projectID: promptData.projectID,
    versions: versions.map(version => toVersion(version, runs)),
    endpoints: endpoints.map(endpoint => ({
      ...toEndpoint(endpoint),
      url: buildURL(`/${endpoint.projectURLPath}/${endpoint.urlPath}`),
      apiKeyDev: projectData?.apiKeyDev ?? '',
      usage: toUsage(usages.find(usage => getID(usage) === getID(endpoint))),
    })),
    users,
    inputs,
    projectURLPath: projectData?.urlPath ?? '',
    availableLabels: projectData ? JSON.parse(projectData.labels) : [],
    availableFlavors: projectData ? JSON.parse(projectData.flavors) : [],
  }
}

export const DefaultPromptName = 'New Prompt'

export async function addPromptForUser(userID: number, projectID: number): Promise<number> {
  await ensureProjectAccess(userID, projectID)
  const createdAt = new Date()
  const promptData = toPromptData(projectID, DefaultPromptName, '', createdAt, createdAt, false)
  await getDatastore().save(promptData)
  await saveVersionForUser(userID, toID(promptData))
  return toID(promptData)
}

export async function updatePrompt(promptData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toPromptData(
      promptData.projectID,
      promptData.name,
      promptData.prompt,
      promptData.createdAt,
      updateLastEditedTimestamp ? new Date() : promptData.lastEditedAt,
      promptData.favorited,
      getID(promptData)
    )
  )
}

export const getVerifiedUserPromptData = async (userID: number, promptID: number) => {
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  if (!promptData) {
    throw new Error(`Prompt with ID ${promptID} does not exist or user has no access`)
  }
  await ensureProjectAccess(userID, promptData.projectID)
  return promptData
}

export async function ensurePromptAccess(userID: number, promptID: number) {
  await getVerifiedUserPromptData(userID, promptID)
}

export async function updatePromptProject(userID: number, promptID: number, projectID: number) {
  // TODO should we update the endpoints project url paths or even refuse when prompt has published endpoints?
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  await updatePrompt({ ...promptData, projectID }, true)
}

export async function updatePromptName(userID: number, promptID: number, name: string) {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  await updatePrompt({ ...promptData, name }, true)
}

export async function toggleFavoritePrompt(userID: number, promptID: number, favorited: boolean) {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  await updatePrompt({ ...promptData, favorited }, false)
}

export async function deletePromptForUser(userID: number, promptID: number) {
  // TODO warn or even refuse when prompt has published endpoints
  await ensurePromptAccess(userID, promptID)
  const versionKeys = await getEntityKeys(Entity.VERSION, 'promptID', promptID)
  const endpointKeys = await getEntityKeys(Entity.ENDPOINT, 'promptID', promptID)
  const usageKeys = await getEntityKeys(Entity.USAGE, 'promptID', promptID)
  const runKeys = await getEntityKeys(Entity.RUN, 'promptID', promptID)
  await getDatastore().delete([
    ...runKeys,
    ...usageKeys,
    ...endpointKeys,
    ...versionKeys,
    buildKey(Entity.PROMPT, promptID),
  ])
}
