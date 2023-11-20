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
  getRecentEntities,
  getTimestamp,
} from './datastore'
import { getUniqueNameWithFormat, getVerifiedProjectScopedData } from './prompts'
import { saveUsage } from './usage'
import { CheckValidURLPath } from '@/src/common/formatting'
import { getTrustedUserPromptOrChainData, getVerifiedUserPromptOrChainData } from './chains'
import { ensureProjectAccess } from './projects'
import { getTrustedVersion } from './versions'

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

const getVerifiedUserEndpointData = async (userID: number, endpointID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.ENDPOINT], endpointID)

const ensureEndpointAccess = (userID: number, endpointID: number) => getVerifiedUserEndpointData(userID, endpointID)

async function ensureValidEndpointData(projectID: number, parentID: number, versionID: number) {
  const parentData = await getTrustedUserPromptOrChainData(parentID)
  if (parentData.projectID !== projectID) {
    throw new Error(
      `Item with ID ${parentID} does not belong to project with ID ${projectID}`
    )
  }
  const versionData = await getTrustedVersion(versionID)
  if (versionData.parentID !== parentID) {
    throw new Error(
      `Version with ID ${versionID} does not belong to item with ID ${parentID}`
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
  await ensureProjectAccess(userID, projectID)
  await ensureValidEndpointData(projectID, parentID, versionID)
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
  const endpointData = await getVerifiedUserEndpointData(userID, endpointID)
  await ensureValidEndpointData(endpointData.projectID, parentID, versionID)
  if (urlPath !== endpointData.urlPath) {
    urlPath = await getValidURLPath(endpointData.projectID, parentID, urlPath, flavor, endpointID)
  }
  await getDatastore().save(
    toEndpointData(
      enabled,
      userID,
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
  await ensureEndpointAccess(userID, endpointID)
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
  versionID: data.versionID,
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  flavor: data.flavor,
  useCache: data.useCache,
  useStreaming: data.useStreaming,
})

export async function getRecentEndpoints(since: Date, before: Date | undefined, limit: number): Promise<Endpoint[]> {
  const recentEndpointsData = await getRecentEntities(Entity.ENDPOINT, limit, since, before)
  return recentEndpointsData.map(toEndpoint)
}
