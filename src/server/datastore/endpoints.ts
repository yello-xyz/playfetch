import { Endpoint, PromptConfig } from '@/types'
import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntityID,
  getFilteredEntity,
  getID,
  getKeyedEntity,
  getTimestamp,
  toID,
} from './datastore'
import { ensurePromptAccess, getVerifiedUserPromptData } from './prompts'
import { saveOrResetUsage } from './usage'
import { ensureProjectAccess } from './projects'

export async function migrateEndpoints() {
  const datastore = getDatastore()
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  for (const endpointData of allEndpoints) {
    await saveOrResetUsage(getID(endpointData), endpointData.promptID)
  }
}

export async function checkCanSaveEndpoint(
  promptID: number,
  urlPath: string,
  projectURLPath: string
): Promise<boolean> {
  const endpointData = await getEndpointFromPath(urlPath, projectURLPath)
  return !endpointData || endpointData.promptID === promptID
}

async function ensureEndpointAccess(userID: number, projectID: number, promptID: number) {
  if (promptID === projectID) {
    await ensureProjectAccess(userID, promptID)
  } else {
    const promptData = await getVerifiedUserPromptData(userID, promptID)
    if (promptData?.projectID !== projectID) {
      throw new Error(`Prompt with ID ${promptID} does not belong to project with ID ${projectID}`)
    }  
  }
}

async function ensureProjectIDFromURLPath(projectURLPath: string) {
  const projectID = await getEntityID(Entity.PROJECT, 'urlPath', projectURLPath)
  if (!projectID) {
    throw new Error(`Project with URL path ${projectURLPath} does not exist`)
  }
  return projectID
}

export async function saveEndpoint(
  userID: number,
  promptID: number,
  versionID: number,
  urlPath: string,
  projectURLPath: string,
  flavor: string,
  prompt: string,
  config: PromptConfig,
  useCache: boolean
) {
  const projectID = await ensureProjectIDFromURLPath(projectURLPath)
  await ensureEndpointAccess(userID, projectID, promptID)
  if (!(await checkCanSaveEndpoint(promptID, urlPath, projectURLPath))) {
    throw new Error(`Endpoint ${urlPath} already used for different prompt in project with ID ${projectID}`)
  }
  const previouslySaved = await getFilteredEntity(
    Entity.ENDPOINT,
    and([buildFilter('promptID', promptID), buildFilter('flavor', flavor)])
  )
  const endpointData = toEndpointData(
    userID,
    promptID,
    versionID,
    urlPath,
    projectURLPath,
    flavor,
    new Date(),
    prompt,
    config,
    useCache,
    previouslySaved ? getID(previouslySaved) : undefined
  )
  await getDatastore().save(endpointData)
  await saveOrResetUsage(toID(endpointData), promptID)
}

export async function getEndpointFromPath(
  urlPath: string,
  projectURLPath: string,
  flavor?: string
): Promise<Endpoint | undefined> {
  const endpoint = await getFilteredEntity(
    Entity.ENDPOINT,
    and([
      buildFilter('urlPath', urlPath),
      buildFilter('projectURLPath', projectURLPath),
      ...(flavor ? [buildFilter('flavor', flavor)] : []),
    ])
  )
  return endpoint ? toEndpoint(endpoint) : undefined
}

export async function toggleEndpointCache(userID: number, endpointID: number, useCache: boolean) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  await ensurePromptAccess(userID, endpointData.promptID)
  await getDatastore().save(
    toEndpointData(
      endpointData.userID,
      endpointData.promptID,
      endpointData.versionID,
      endpointData.urlPath,
      endpointData.projectURLPath,
      endpointData.flavor,
      endpointData.createdAt,
      endpointData.prompt,
      JSON.parse(endpointData.config),
      useCache,
      getID(endpointData)
    )
  )
}

export async function deleteEndpointForUser(userID: number, endpointID: number) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  const projectID = await ensureProjectIDFromURLPath(endpointData.projectURLPath)
  await ensureEndpointAccess(userID, projectID, endpointData.promptID)
  await getDatastore().delete([buildKey(Entity.ENDPOINT, endpointID), buildKey(Entity.USAGE, endpointID)])
}

const toEndpointData = (
  userID: number,
  promptID: number,
  versionID: number,
  urlPath: string,
  projectURLPath: string,
  flavor: string,
  createdAt: Date,
  prompt: string,
  config: PromptConfig,
  useCache: boolean,
  endpointID?: number
) => ({
  key: buildKey(Entity.ENDPOINT, endpointID),
  data: {
    userID,
    promptID,
    versionID,
    urlPath,
    projectURLPath,
    flavor,
    createdAt,
    prompt,
    config: JSON.stringify(config),
    useCache,
  },
  excludeFromIndexes: ['prompt', 'config'],
})

export const toEndpoint = (data: any): Endpoint => ({
  id: getID(data),
  promptID: data.promptID,
  versionID: data.versionID,
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  flavor: data.flavor,
  prompt: data.prompt,
  config: JSON.parse(data.config),
  useCache: data.useCache,
})
