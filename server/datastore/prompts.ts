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

const toPromptData = (
  userID: number,
  projectID: number | null,
  name: string,
  prompt: string,
  createdAt: Date,
  lastEditedAt?: Date,
  promptID?: number
) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { userID, projectID, prompt, name, createdAt, lastEditedAt: lastEditedAt ?? createdAt },
  excludeFromIndexes: ['name', 'prompt'],
})

const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  prompt: StripPromptSentinels(data.prompt ?? ''),
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt') ?? getTimestamp(data),
})

const toActivePrompt = (data: any, versions: any[], runs: any[], endpointData?: any): ActivePrompt => ({
  ...toPrompt(data),
  versions: versions.map(version => toVersion(version, runs)),
  ...(endpointData ? { endpoint: toEndpoint(endpointData) } : {}),
})

export async function getPromptsForProject(userID: number, projectID: number | null): Promise<Prompt[]> {
  const prompts = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID, 'lastEditedAt')
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
  const promptData = toPromptData(userID, projectID, name, '', new Date())
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
      promptID
    )
  )
}
