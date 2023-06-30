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
} from './datastore'
import { ensurePromptAccess, getVerifiedUserPromptData } from './prompts'

export async function migrateEndpoints() {
  const datastore = getDatastore()
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  for (const endpointData of allEndpoints) {
    await datastore.save(
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
        endpointData.useCache,
        getID(endpointData)
      )
    )
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
  const promptData = await getVerifiedUserPromptData(userID, promptID)
  const projectID = await getEntityID(Entity.PROJECT, 'urlPath', projectURLPath)
  if (!projectID) {
    throw new Error(`Project with URL path ${projectURLPath} does not exist`)
  }
  if (promptData?.projectID !== projectID) {
    throw new Error(`Prompt with ID ${promptID} does not belong to project with ID ${projectID}`)
  }
  if (!(await checkCanSaveEndpoint(promptID, urlPath, projectURLPath))) {
    throw new Error(`Endpoint ${urlPath} already used for different prompt in project with ID ${projectID}`)
  }
  const previouslySaved = await getFilteredEntity(
    Entity.ENDPOINT,
    and([buildFilter('promptID', promptID), buildFilter('flavor', flavor)])
  )
  await getDatastore().save(
    toEndpointData(
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
  )
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

export async function deleteEndpointForUser(userID: number, endpointID: number) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  try {
    await ensurePromptAccess(userID, endpointData.promptID)
  } catch {
    throw new Error(`Endpoint with ID ${endpointID} does not exist or user has no access`)
  }
  await getDatastore().delete(buildKey(Entity.ENDPOINT, endpointID))
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
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  prompt: data.prompt,
  config: JSON.parse(data.config),
  useCache: data.useCache,
})
