import { Endpoint, RunConfig } from '@/types'
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
import { ensureProjectAccess } from './projects'
import { CheckValidURLPath } from '@/src/common/formatting'

export async function migrateEndpoints() {
  const datastore = getDatastore()
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  for (const endpointData of allEndpoints) {
    await getDatastore().save(
      toEndpointData(
        true,
        endpointData.userID,
        endpointData.promptID,
        JSON.parse(endpointData.chain),
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
}

const buildPathFilter = (urlPath: string, projectURLPath: string, flavor?: string) =>
  and([
    buildFilter('urlPath', urlPath),
    buildFilter('projectURLPath', projectURLPath),
    ...(flavor ? [buildFilter('flavor', flavor)] : []),
  ])

const getValidURLPath = async (promptID: number, name: string, projectURLPath: string, flavor: string) => {
  if (!CheckValidURLPath(name)) {
    throw new Error(`Invalid name ${name} for endpoint`)
  }
  let urlPath = name
  let counter = 2
  while (true) {
    const endpoints = await getFilteredEntities(Entity.ENDPOINT, buildPathFilter(urlPath, projectURLPath))
    if (
      endpoints.every(endpoint => endpoint.promptID === promptID) &&
      !endpoints.some(endpoint => endpoint.flavor === flavor)
    ) {
      return urlPath
    }
    urlPath = `${name}${counter++}`
  }
}

export async function saveEndpoint(
  userID: number,
  promptID: number,
  chain: RunConfig[],
  name: string,
  projectURLPath: string,
  flavor: string,
  useCache: boolean
) {
  await ensureEndpointAccess(userID, promptID, projectURLPath)
  const urlPath = await getValidURLPath(promptID, name, projectURLPath, flavor)
  const endpointData = toEndpointData(
    false,
    userID,
    promptID,
    chain,
    urlPath,
    projectURLPath,
    flavor,
    new Date(),
    useCache
  )
  await getDatastore().save(endpointData)
  await saveUsage(getID(endpointData), promptID)
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
  await ensureEndpointAccess(userID, endpointData.promptID, endpointData.projectURLPath)
  await getDatastore().save(
    toEndpointData(
      enabled,
      endpointData.userID,
      endpointData.promptID,
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
  await ensureEndpointAccess(userID, endpointData.promptID, endpointData.projectURLPath)
  const keysToDelete = [buildKey(Entity.ENDPOINT, endpointID), buildKey(Entity.USAGE, endpointID)]
  await getDatastore().delete(keysToDelete)
}

const toEndpointData = (
  enabled: boolean,
  userID: number,
  promptID: number,
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
  enabled: data.enabled,
  userID: data.userID,
  promptID: data.promptID,
  chain: JSON.parse(data.chain),
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  flavor: data.flavor,
  useCache: data.useCache,
})
