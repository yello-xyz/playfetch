import { Endpoint, PromptConfig } from '@/types'
import { and } from '@google-cloud/datastore'
import ShortUniqueId from 'short-unique-id'
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
import { getVerifiedUserPromptData } from './prompts'

export async function migrateEndpoints() {
  const datastore = getDatastore()
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  for (const endpointData of allEndpoints) {
    await datastore.save(
      toEndpointData(
        getID(endpointData),
        endpointData.urlPath,
        endpointData.projectURLPath,
        endpointData.createdAt,
        endpointData.prompt,
        JSON.parse(endpointData.config),
        endpointData.useCache,
        endpointData.token
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
  return !endpointData || endpointData.id === promptID
}

export async function saveEndpoint(
  userID: number,
  promptID: number,
  urlPath: string,
  projectURLPath: string,
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
  const token = new ShortUniqueId({ length: 12, dictionary: 'alpha_upper' })()
  await getDatastore().save(
    toEndpointData(promptID, urlPath, projectURLPath, new Date(), prompt, config, useCache, token)
  )
}

export async function getEndpointFromPath(
  urlPath: string,
  projectURLPath: string,
  token?: string
): Promise<Endpoint | undefined> {
  const endpoint = await getFilteredEntity(
    Entity.ENDPOINT,
    and([buildFilter('urlPath', urlPath), buildFilter('projectURLPath', projectURLPath)])
  )
  return endpoint && (!token || endpoint.token === token) ? toEndpoint(endpoint) : undefined
}

export async function deleteEndpointForUser(userID: number, promptID: number) {
  await getVerifiedUserPromptData(userID, promptID)
  await getDatastore().delete(buildKey(Entity.ENDPOINT, promptID))
}

const toEndpointData = (
  promptID: number,
  urlPath: string,
  projectURLPath: string,
  createdAt: Date,
  prompt: string,
  config: PromptConfig,
  useCache: boolean,
  token: string
) => ({
  key: buildKey(Entity.ENDPOINT, promptID),
  data: { urlPath, projectURLPath, createdAt, prompt, config: JSON.stringify(config), useCache, token },
  excludeFromIndexes: ['prompt', 'config'],
})

export const toEndpoint = (data: any): Endpoint => ({
  id: getID(data),
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  prompt: data.prompt,
  config: JSON.parse(data.config),
  useCache: data.useCache,
  token: data.token,
})
