import { Endpoint, RunConfig } from '@/types'
import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntity,
  getEntityID,
  getFilteredEntities,
  getFilteredEntity,
  getID,
  getKeyedEntity,
  getProjectID,
  getTimestamp,
} from './datastore'
import { getVerifiedUserPromptData } from './prompts'
import { saveUsage, updateUsage } from './usage'
import { ensureProjectAccess } from './projects'
import { CheckValidURLPath } from '@/src/common/formatting'
import { addChainForUser } from './chains'

export async function migrateEndpoints() {
  const datastore = getDatastore()
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  for (const endpointData of allEndpoints) {
    const chain = JSON.parse(endpointData.chain)
    if (chain.length > 1) {
      const projectData = await getEntity(Entity.PROJECT, 'urlPath', endpointData.projectURLPath)
      const parentID = await addChainForUser(endpointData.userID, getID(projectData))

      await getDatastore().save(
        toEndpointData(
          endpointData.enabled,
          endpointData.userID,
          parentID,
          JSON.parse(endpointData.chain),
          endpointData.urlPath,
          endpointData.projectURLPath,
          endpointData.flavor,
          endpointData.createdAt,
          endpointData.useCache,
          getID(endpointData)
        )
      )

      await updateUsage(getID(endpointData), parentID, 0, false, 0, false)
    }
  }
}

async function ensureEndpointAccess(userID: number, parentID: number, projectURLPath: string) {
  const projectID = await getEntityID(Entity.PROJECT, 'urlPath', projectURLPath)
  if (!projectID) {
    throw new Error(`Project with URL path ${projectURLPath} does not exist`)
  }
  if (parentID === projectID) {
    await ensureProjectAccess(userID, parentID)
  } else {
    const promptData = await getVerifiedUserPromptData(userID, parentID)
    if (promptData?.projectID !== projectID) {
      throw new Error(`Prompt with ID ${parentID} does not belong to project with ID ${projectID}`)
    }
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
  chain: RunConfig[],
  name: string,
  projectURLPath: string,
  flavor: string,
  useCache: boolean
) {
  await ensureEndpointAccess(userID, parentID, projectURLPath)
  const urlPath = await getValidURLPath(parentID, name, projectURLPath, flavor)
  const endpointData = toEndpointData(
    false,
    userID,
    parentID,
    chain,
    urlPath,
    projectURLPath,
    flavor,
    new Date(),
    useCache
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
  chain: RunConfig[],
  urlPath: string,
  flavor: string,
  useCache: boolean
) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  await ensureEndpointAccess(userID, endpointData.parentID, endpointData.projectURLPath)
  if (urlPath !== endpointData.urlPath) {
    urlPath = await getValidURLPath(endpointData.parentID, urlPath, endpointData.projectURLPath, flavor, endpointID)
  }
  await getDatastore().save(
    toEndpointData(
      enabled,
      endpointData.userID,
      endpointData.parentID,
      chain,
      urlPath,
      endpointData.projectURLPath,
      flavor,
      endpointData.createdAt,
      useCache,
      getID(endpointData)
    )
  )
}

export async function deleteEndpointForUser(userID: number, endpointID: number) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, endpointID)
  await ensureEndpointAccess(userID, endpointData.parentID, endpointData.projectURLPath)
  const keysToDelete = [buildKey(Entity.ENDPOINT, endpointID), buildKey(Entity.USAGE, endpointID)]
  await getDatastore().delete(keysToDelete)
}

const toEndpointData = (
  enabled: boolean,
  userID: number,
  parentID: number,
  chain: RunConfig[],
  urlPath: string,
  projectURLPath: string,
  flavor: string,
  createdAt: Date,
  useCache: boolean,
  endpointID?: number
) => ({
  key: buildKey(Entity.ENDPOINT, endpointID),
  data: {
    enabled,
    userID,
    parentID,
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
  enabled: data.enabled,
  userID: data.userID,
  parentID: data.parentID,
  chain: JSON.parse(data.chain),
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  flavor: data.flavor,
  useCache: data.useCache,
})
