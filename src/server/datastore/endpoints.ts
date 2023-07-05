import { Chain, Endpoint } from '@/types'
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
import { getVerifiedUserPromptData } from './prompts'
import { saveOrResetUsage } from './usage'
import { ensureProjectAccess } from './projects'
import { getChain } from './chains'

export async function migrateEndpoints() {
  const datastore = getDatastore()
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  for (const endpointData of allEndpoints) {
    const projectID = await getEntityID(Entity.PROJECT, 'urlPath', endpointData.projectURLPath)
    let chain: Chain
    if (endpointData.promptID === projectID) {
      chain = await getChain(endpointData.versionID)
    } else {
      chain = [{ promptID: endpointData.promptID, versionID: endpointData.versionID }]
    }
    await getDatastore().save(
      toEndpointData(
        endpointData.userID,
        endpointData.promptID,
        chain,
        endpointData.urlPath,
        endpointData.projectURLPath,
        endpointData.flavor,
        endpointData.createdAt,
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

async function ensureEndpointAccess(userID: number, promptID: number, projectURLPath: string) {
  const projectID = await getEntityID(Entity.PROJECT, 'urlPath', projectURLPath)
  if (!projectID) {
    throw new Error(`Project with URL path ${projectURLPath} does not exist`)
  }
  if (promptID === projectID) {
    await ensureProjectAccess(userID, promptID)
  } else {
    const promptData = await getVerifiedUserPromptData(userID, promptID)
    if (promptData?.projectID !== projectID) {
      throw new Error(`Prompt with ID ${promptID} does not belong to project with ID ${projectID}`)
    }  
  }
  return projectID
}

export async function saveEndpoint(
  userID: number,
  promptID: number,
  chain: Chain,
  urlPath: string,
  projectURLPath: string,
  flavor: string,
  useCache: boolean
) {
  const projectID = await ensureEndpointAccess(userID, promptID, projectURLPath)
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
    chain,
    urlPath,
    projectURLPath,
    flavor,
    new Date(),
    useCache,
    previouslySaved ? getID(previouslySaved) : undefined
  )
  await getDatastore().save(endpointData)
  await saveOrResetUsage(getID(endpointData), promptID)
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
  await ensureEndpointAccess(userID, endpointData.promptID, endpointData.projectURLPath)
  await getDatastore().save(
    toEndpointData(
      endpointData.userID,
      endpointData.promptID,
      JSON.parse(endpointData.chain),
      endpointData.urlPath,
      endpointData.projectURLPath,
      endpointData.flavor,
      endpointData.createdAt,
      useCache,
      getID(endpointData)
    )
  )
}

export async function deleteEndpointForUser(userID: number, endpointID: number) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  const projectID = await ensureEndpointAccess(userID, endpointData.promptID, endpointData.projectURLPath)
  const keysToDelete = [buildKey(Entity.ENDPOINT, endpointID), buildKey(Entity.USAGE, endpointID)]
  if (endpointData.promptID === projectID) {
    keysToDelete.push(buildKey(Entity.CHAIN, endpointData.versionID))
  }
  await getDatastore().delete(keysToDelete)
}

const toEndpointData = (
  userID: number,
  promptID: number,
  chain: Chain,
  urlPath: string,
  projectURLPath: string,
  flavor: string,
  createdAt: Date,
  useCache: boolean,
  endpointID?: number
) => ({
  key: buildKey(Entity.ENDPOINT, endpointID),
  data: {
    userID,
    promptID,
    chain: JSON.stringify(chain),
    urlPath,
    projectURLPath,
    flavor,
    createdAt,
    useCache,
  },
  excludeFromIndexes: ['chain'],
})

export const toEndpoint = (data: any): Endpoint => ({
  id: getID(data),
  promptID: data.promptID,
  chain: JSON.parse(data.versionID),
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  flavor: data.flavor,
  useCache: data.useCache,
})
