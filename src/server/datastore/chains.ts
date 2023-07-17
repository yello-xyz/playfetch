import {
  Entity,
  buildKey,
  getDatastore,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
} from './datastore'
import { ActiveChain, Chain } from '@/types'
import { ensureProjectAccess, getProjectUsers } from './projects'
import { getProjectInputValues } from './inputs'
import { getVerifiedProjectScopedData, loadEndpoints, toPrompt } from './prompts'

export async function migrateChains() {
  const datastore = getDatastore()
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptChain of allChains) {
    await updateChain({ ...promptChain }, false)
  }
}

const toChainData = (
  projectID: number,
  name: string,
  createdAt: Date,
  lastEditedAt: Date,
  favorited: number[],
  chainID?: number
) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: { projectID, name, createdAt, lastEditedAt, favorited: JSON.stringify(favorited) },
  excludeFromIndexes: ['name'],
})

export const toChain = (data: any, userID: number): Chain => ({
  id: getID(data),
  name: data.name,
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt') ?? getTimestamp(data),
  favorited: JSON.parse(data.favorited).includes(userID),
})

export async function getActiveChain(
  userID: number,
  chainID: number,
  buildURL: (path: string) => string
): Promise<ActiveChain> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const projectData = await getKeyedEntity(Entity.PROJECT, chainData.projectID)
  // const items = await getOrderedEntities(Entity.CHAIN_ITEM, 'chainID', chainID)
  const users = await getProjectUsers(chainData.projectID)
  const inputs = await getProjectInputValues(chainData.projectID)
  const endpoints = await loadEndpoints(chainID, projectData, buildURL)
  const promptData = await getOrderedEntities(Entity.PROMPT, 'projectID', chainData.projectID, ['lastEditedAt'])
  const prompts = promptData.map(prompt => toPrompt(prompt, userID))

  return {
    ...toChain(chainData, userID),
    projectID: chainData.projectID,
    // items: items.map(item => toChainItem(item)).reverse(),
    endpoints,
    users,
    inputs,
    prompts: [...prompts.filter(prompt => prompt.favorited), ...prompts.filter(prompt => !prompt.favorited)],
    projectURLPath: projectData.urlPath ?? '',
    availableFlavors: JSON.parse(projectData.flavors),
  }
}

export const DefaultChainName = 'New Chain'

export async function addChainForUser(userID: number, projectID: number): Promise<number> {
  await ensureProjectAccess(userID, projectID)
  const createdAt = new Date()
  const chainData = toChainData(projectID, DefaultChainName, createdAt, createdAt, [])
  await getDatastore().save(chainData)
  return getID(chainData)
}

export async function updateChain(chainData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toChainData(
      chainData.projectID,
      chainData.name,
      chainData.createdAt,
      updateLastEditedTimestamp ? new Date() : chainData.lastEditedAt,
      JSON.parse(chainData.favorited),
      getID(chainData)
    )
  )
}

export const getVerifiedUserChainData = async (userID: number, chainID: number) =>
  getVerifiedProjectScopedData(userID, Entity.CHAIN, chainID)

export async function ensureChainAccess(userID: number, chainID: number) {
  await getVerifiedUserChainData(userID, chainID)
}

export async function updateChainName(userID: number, chainID: number, name: string) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  await updateChain({ ...chainData, name }, true)
}

export async function toggleFavoriteChain(userID: number, chainID: number, favorited: boolean) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const oldFavorited = JSON.parse(chainData.favorited)
  await updateChain(
    {
      ...chainData,
      favorited: JSON.stringify(
        favorited ? [...oldFavorited, userID] : oldFavorited.filter((id: number) => id !== userID)
      ),
    },
    false
  )
}

export async function deleteChainForUser(userID: number, chainID: number) {
  // TODO warn or even refuse when chain has published endpoints
  await ensureChainAccess(userID, chainID)
  // const itemKeys = await getEntityKeys(Entity.CHAIN_ITEM, 'chainID', chainID)
  const endpointKeys = await getEntityKeys(Entity.ENDPOINT, 'parentID', chainID)
  const usageKeys = await getEntityKeys(Entity.USAGE, 'parentID', chainID)
  await getDatastore().delete([
    ...usageKeys,
    ...endpointKeys,
    // ...itemKeys,
    buildKey(Entity.CHAIN, chainID),
  ])
}
