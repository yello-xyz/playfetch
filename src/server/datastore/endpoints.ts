import { ChainItem, Endpoint } from '@/types'
import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntityID,
  getFilteredEntities,
  getFilteredEntity,
  getID,
  getKeyedEntity,
  getTimestamp,
} from './datastore'
import { getVerifiedUserPromptData } from './prompts'
import { saveUsage } from './usage'
import { CheckValidURLPath } from '@/src/common/formatting'
import { getVerifiedUserChainData } from './chains'

export async function migrateEndpoints() {
  const datastore = getDatastore()
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  for (const endpointData of allEndpoints) {
    await getDatastore().save(
      toEndpointData(
        endpointData.enabled,
        endpointData.userID,
        endpointData.parentID,
        endpointData.versionID,
        endpointData.urlPath,
        endpointData.projectURLPath,
        endpointData.flavor,
        endpointData.createdAt,
        endpointData.useCache,
        endpointData.useStreaming,
        getID(endpointData)
      )
    )
  }
}

async function ensureEndpointAccess(
  userID: number,
  endpointData: {
    parentID: number
    versionID: number | null
    projectURLPath: string
  }
) {
  const projectID = await getEntityID(Entity.PROJECT, 'urlPath', endpointData.projectURLPath)
  if (!projectID) {
    throw new Error(`Project with URL path ${endpointData.projectURLPath} does not exist`)
  }
  const data = endpointData.versionID
    ? await getVerifiedUserPromptData(userID, endpointData.parentID)
    : await getVerifiedUserChainData(userID, endpointData.parentID)
  if (data.projectID !== projectID) {
    throw new Error(`Item with ID ${endpointData.parentID} does not belong to project with ID ${projectID}`)
  }
}

const buildPathFilter = (urlPath: string, projectURLPath: string, flavor?: string) =>
  and([
    buildFilter('urlPath', urlPath),
    buildFilter('projectURLPath', projectURLPath),
    ...(flavor ? [buildFilter('flavor', flavor)] : []),
  ])

const getValidURLPath = async (
  parentID: number,
  name: string,
  projectURLPath: string,
  flavor: string,
  endpointID?: number
) => {
  if (!CheckValidURLPath(name)) {
    throw new Error(`Invalid name ${name} for endpoint`)
  }
  let urlPath = name
  let counter = 2
  while (true) {
    const endpoints = await getFilteredEntities(Entity.ENDPOINT, buildPathFilter(urlPath, projectURLPath))
    if (
      endpoints.every(endpoint => endpoint.parentID === parentID) &&
      endpoints.filter(endpoint => endpoint.flavor === flavor).every(endpoint => getID(endpoint) === endpointID)
    ) {
      return urlPath
    }
    urlPath = `${name}${counter++}`
  }
}

export async function saveEndpoint(
  userID: number,
  parentID: number,
  versionID: number | null,
  name: string,
  projectURLPath: string,
  flavor: string,
  useCache: boolean,
  useStreaming: boolean
) {
  await ensureEndpointAccess(userID, { parentID, versionID, projectURLPath })
  const urlPath = await getValidURLPath(parentID, name, projectURLPath, flavor)
  const endpointData = toEndpointData(
    false,
    userID,
    parentID,
    versionID,
    urlPath,
    projectURLPath,
    flavor,
    new Date(),
    useCache,
    useStreaming,
  )
  await getDatastore().save(endpointData)
  await saveUsage(getID(endpointData), parentID)
}

export const DefaultEndpointFlavor = 'default'

export async function getActiveEndpointFromPath(
  urlPath: string,
  projectURLPath: string,
  flavor: string | undefined
): Promise<Endpoint | undefined> {
  const endpoint = await getFilteredEntity(
    Entity.ENDPOINT,
    buildPathFilter(urlPath, projectURLPath, flavor ?? DefaultEndpointFlavor)
  )
  return endpoint?.enabled ? toEndpoint(endpoint) : undefined
}

export async function updateEndpointForUser(
  userID: number,
  endpointID: number,
  enabled: boolean,
  versionID: number | null,
  urlPath: string,
  flavor: string,
  useCache: boolean,
  useStreaming: boolean
) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  await ensureEndpointAccess(userID, endpointData)
  if (urlPath !== endpointData.urlPath) {
    urlPath = await getValidURLPath(endpointData.parentID, urlPath, endpointData.projectURLPath, flavor, endpointID)
  }
  await getDatastore().save(
    toEndpointData(
      enabled,
      endpointData.userID,
      endpointData.parentID,
      versionID,
      urlPath,
      endpointData.projectURLPath,
      flavor,
      endpointData.createdAt,
      useCache,
      useStreaming,
      getID(endpointData)
    )
  )
}

export async function deleteEndpointForUser(userID: number, endpointID: number) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  await ensureEndpointAccess(userID, endpointData)
  const keysToDelete = [buildKey(Entity.ENDPOINT, endpointID), buildKey(Entity.USAGE, endpointID)]
  await getDatastore().delete(keysToDelete)
}

const toEndpointData = (
  enabled: boolean,
  userID: number,
  parentID: number,
  versionID: number | null,
  urlPath: string,
  projectURLPath: string,
  flavor: string,
  createdAt: Date,
  useCache: boolean,
  useStreaming: boolean,
  endpointID?: number
) => ({
  key: buildKey(Entity.ENDPOINT, endpointID),
  data: {
    enabled,
    userID,
    parentID,
    versionID,
    urlPath,
    projectURLPath,
    flavor,
    createdAt,
    useCache,
    useStreaming,
  },
  excludeFromIndexes: [],
})

export const toEndpoint = (data: any): Endpoint => ({
  id: getID(data),
  enabled: data.enabled,
  userID: data.userID,
  parentID: data.parentID,
  versionID: data.versionID ?? null,
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  flavor: data.flavor,
  useCache: data.useCache,
  useStreaming: data.useStreaming,
})
