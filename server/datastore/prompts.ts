import { StripPromptSentinels } from '@/common/formatting'
import {
  Entity,
  buildKey,
  getDatastore,
  getEntity,
  getID,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
  toID,
} from './datastore'
import { saveVersionForUser, toVersion } from './versions'
import { toEndpoint } from './endpoints'
import { ActivePrompt, Prompt } from '@/types'

export async function migratePrompts() {
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await datastore.save(
      toPromptData(
        promptData.userID,
        promptData.projectID,
        promptData.name,
        promptData.prompt,
        promptData.createdAt,
        promptData.lastEditedAt,
        promptData.favorited,
        getID(promptData)
      )
    )
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
  const prompts = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID, ['favorited', 'lastEditedAt'])
  return prompts.filter(prompt => prompt.userID === userID).map(prompt => toPrompt(prompt))
}

export async function getPromptWithVersions(userID: number, promptID: number): Promise<ActivePrompt> {
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  if (!promptData || promptData?.userID !== userID) {
    throw new Error(`Prompt with ID ${promptID} does not exist or user has no access`)
  }
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, promptID)
  const versions = await getOrderedEntities(Entity.VERSION, 'promptID', promptID)
  const runs = await getOrderedEntities(Entity.RUN, 'promptID', promptID)
  versions.filter(version => version.userID === userID).map(version => toVersion(version, runs))

  return toActivePrompt(
    promptData,
    versions.filter(version => version.userID === userID),
    runs,
    endpointData
  )
}

export async function addPromptForUser(userID: number, name: string, projectID: number | null): Promise<number> {
  const createdAt = new Date()
  const promptData = toPromptData(userID, projectID, name, '', createdAt, createdAt, false)
  await getDatastore().save(promptData)
  await saveVersionForUser(userID, toID(promptData), '', '')
  return toID(promptData)
}

export async function updatePrompt(promptData: any) {
  const promptID = getID(promptData)
  const lastVersionData = await getEntity(Entity.VERSION, 'promptID', promptID, true)
  await getDatastore().save(
    toPromptData(
      promptData.userID,
      promptData.projectID,
      promptData.name,
      lastVersionData.prompt,
      promptData.createdAt,
      new Date(),
      promptData.favorited,
      promptID
    )
  )
}

export async function toggleFavoritePrompt(userID: number, promptID: number, favorited: boolean) {
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  if (promptData?.userID !== userID) {
    throw new Error(`Prompt with ID ${promptID} does not exist or user has no access`)
  }
  await getDatastore().save(
    toPromptData(
      promptData.userID,
      promptData.projectID,
      promptData.name,
      promptData.prompt,
      promptData.createdAt,
      promptData.lastEditedAt,
      favorited,
      promptID
    )
  )
}