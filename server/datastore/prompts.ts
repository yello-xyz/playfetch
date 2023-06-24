import { StripPromptSentinels } from '@/common/formatting'
import {
  Entity,
  buildKey,
  getDatastore,
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
import { getVerifiedUserProjectData } from './projects'

export async function migratePrompts() {
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await updatePrompt({ ...promptData }, false)
  }
}

const toPromptData = (
  userID: number,
  projectID: number | null,
  name: string,
  prompt: string,
  createdAt: Date,
  lastEditedAt: Date,
  favorited: boolean,
  promptID?: number
) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { userID, projectID, prompt, name, createdAt, lastEditedAt, favorited },
  excludeFromIndexes: ['name', 'prompt'],
})

const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  prompt: StripPromptSentinels(data.prompt),
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt') ?? getTimestamp(data),
  favorited: data.favorited,
})

const toActivePrompt = (data: any, versions: any[], runs: any[], endpointData?: any): ActivePrompt => ({
  ...toPrompt(data),
  versions: versions.map(version => toVersion(version, runs)),
  ...(endpointData ? { endpoint: toEndpoint(endpointData) } : {}),
})

export async function getPromptsForProject(userID: number, projectID: number | null): Promise<Prompt[]> {
  // TODO use userID rather than null as projectID so we don't need to query & filter prompts for ALL users!
  const prompts = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID, ['favorited', 'lastEditedAt'])
  return prompts.filter(prompt => prompt.userID === userID).map(prompt => toPrompt(prompt))
}

export async function getPromptWithVersions(userID: number, promptID: number): Promise<ActivePrompt> {
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, promptID)
  const versions = await getOrderedEntities(Entity.VERSION, 'promptID', promptID)
  const runs = await getOrderedEntities(Entity.RUN, 'promptID', promptID)

  return toActivePrompt(
    promptData,
    versions,
    runs,
    endpointData
  )
}

export const DefaultPromptName = 'New Prompt'

export async function addPromptForUser(userID: number, projectID: number | null): Promise<number> {
  const createdAt = new Date()
  const promptData = toPromptData(userID, projectID, DefaultPromptName, '', createdAt, createdAt, false)
  await getDatastore().save(promptData)
  await saveVersionForUser(userID, toID(promptData))
  return toID(promptData)
}

export async function updatePrompt(promptData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toPromptData(
      promptData.userID,
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
  if (!promptData || promptData?.userID !== userID) {
    throw new Error(`Prompt with ID ${promptID} does not exist or user has no access`)
  }
  return promptData
}

export async function updatePromptProject(userID: number, promptID: number, projectID: number) {
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
  await getVerifiedUserPromptData(userID, promptID)
  const versionIDs = await getEntityKeys(Entity.VERSION, 'promptID', promptID)
  const runIDs = await getEntityKeys(Entity.RUN, 'promptID', promptID)
  await getDatastore().delete([
    ...runIDs,
    ...versionIDs,
    buildKey(Entity.ENDPOINT, promptID),
    buildKey(Entity.PROMPT, promptID),
  ])
}
