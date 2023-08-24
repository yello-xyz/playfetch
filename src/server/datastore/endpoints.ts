import { Endpoint } from '@/types'
import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntityKeys,
  getFilteredEntities,
  getFilteredEntity,
  getID,
  getKeyedEntity,
  getTimestamp,
} from './datastore'
import { getUniqueNameWithFormat, getVerifiedUserPromptData } from './prompts'
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
        endpointData.projectID,
        endpointData.parentID,
        endpointData.versionID,
        endpointData.urlPath,
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
    projectID: number
    parentID: number
    versionID: number
  }
) {
  const data = endpointData.versionID
    ? await getVerifiedUserPromptData(userID, endpointData.parentID)
    : await getVerifiedUserChainData(userID, endpointData.parentID)
  if (data.projectID !== endpointData.projectID) {
    throw new Error(
      `Item with ID ${endpointData.parentID} does not belong to project with ID ${endpointData.projectID}`
    )
  }
}

const buildPathFilter = (projectID: number, urlPath: string, flavor?: string) =>
  and([
    buildFilter('projectID', projectID),
    buildFilter('urlPath', urlPath),
    ...(flavor ? [buildFilter('flavor', flavor)] : []),
  ])

const getValidURLPath = async (
  projectID: number,
  parentID: number,
  name: string,
  flavor: string,
  endpointID?: number
) => {
  if (!CheckValidURLPath(name)) {
    throw new Error(`Invalid name ${name} for endpoint`)
  }
  return getUniqueNameWithFormat(
    name,
    async urlPath => {
      const endpoints = await getFilteredEntities(Entity.ENDPOINT, buildPathFilter(projectID, urlPath))
      return (
        endpoints.some(endpoint => endpoint.parentID !== parentID) ||
        endpoints.filter(endpoint => endpoint.flavor === flavor).some(endpoint => getID(endpoint) !== endpointID)
      )
    },
    (name, counter) => `${name}${counter}`
  )
}

export async function saveEndpoint(
  isEnabled: boolean,
  userID: number,
  projectID: number,
  parentID: number,
  versionID: number,
  name: string,
  flavor: string,
  useCache: boolean,
  useStreaming: boolean
) {
  await ensureEndpointAccess(userID, { projectID, parentID, versionID })
  const urlPath = await getValidURLPath(projectID, parentID, name, flavor)
  const endpointData = toEndpointData(
    isEnabled,
    userID,
    projectID,
    parentID,
    versionID,
    urlPath,
    flavor,
    new Date(),
    useCache,
    useStreaming
  )
  await getDatastore().save(endpointData)
  await saveUsage(getID(endpointData), projectID, parentID)
  return getID(endpointData)
}

export const DefaultEndpointFlavor = 'default'

export async function getActiveEndpointFromPath(
  projectID: number,
  urlPath: string,
  flavor: string | undefined
): Promise<Endpoint | undefined> {
  const endpoint = await getFilteredEntity(
    Entity.ENDPOINT,
    buildPathFilter(projectID, urlPath, flavor ?? DefaultEndpointFlavor)
  )
  return endpoint?.enabled ? toEndpoint(endpoint) : undefined
}

export async function updateEndpointForUser(
  userID: number,
  endpointID: number,
  enabled: boolean,
  parentID: number,
  versionID: number,
  urlPath: string,
  flavor: string,
  useCache: boolean,
  useStreaming: boolean
) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  await ensureEndpointAccess(userID, endpointData)
  if (urlPath !== endpointData.urlPath) {
    urlPath = await getValidURLPath(endpointData.projectID, parentID, urlPath, flavor, endpointID)
  }
  await getDatastore().save(
    toEndpointData(
      enabled,
      endpointData.userID,
      endpointData.projectID,
      parentID,
      versionID,
      urlPath,
      flavor,
      endpointData.createdAt,
      useCache,
      useStreaming,
      endpointID
    )
  )
}

export async function deleteEndpointForUser(userID: number, endpointID: number) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  await ensureEndpointAccess(userID, endpointData)
  const logEntryKeys = await getEntityKeys(Entity.LOG, 'endpointID', endpointID)
  const keysToDelete = [...logEntryKeys, buildKey(Entity.ENDPOINT, endpointID), buildKey(Entity.USAGE, endpointID)]
  await getDatastore().delete(keysToDelete)
}

const toEndpointData = (
  enabled: boolean,
  userID: number,
  projectID: number,
  parentID: number,
  versionID: number,
  urlPath: string,
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
    projectID,
    parentID,
    versionID,
    urlPath,
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
  projectID: data.projectID,
  parentID: data.parentID,
  versionID: data.versionID ?? null,
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  flavor: data.flavor,
  useCache: data.useCache,
  useStreaming: data.useStreaming,
})
