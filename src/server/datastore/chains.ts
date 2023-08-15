import {
  Entity,
  buildKey,
  getDatastore,
  getEntities,
  getEntityKey,
  getID,
  getKeyedEntity,
  getTimestamp,
} from './datastore'
import { Chain, ChainItemWithInputs } from '@/types'
import { ensureProjectAccess, updateProjectLastEditedAt } from './projects'
import { getUniqueName, getVerifiedProjectScopedData } from './prompts'

export async function migrateChains() {
  const datastore = getDatastore()
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))
  for (const chainData of allChains) {
    await updateChain({ ...chainData }, false)
  }
}

const toChainData = (
  projectID: number,
  name: string,
  items: ChainItemWithInputs[],
  createdAt: Date,
  lastEditedAt: Date,
  chainID?: number
) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: {
    projectID,
    name,
    items: JSON.stringify(items),
    createdAt,
    lastEditedAt,
  },
  excludeFromIndexes: ['name', 'items'],
})

export const toChain = (data: any): Chain => ({
  id: getID(data),
  name: data.name,
  items: JSON.parse(data.items),
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt'),
})

export async function getChainForUser(userID: number, chainID: number): Promise<Chain> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  return toChain(chainData)
}

export async function getChainItems(chainID: number): Promise<ChainItemWithInputs[]> {
  const chainData = await getKeyedEntity(Entity.CHAIN, chainID)
  return chainData ? JSON.parse(chainData.items) : []
}

const DefaultChainName = 'New Chain'

export async function addChainForUser(userID: number, projectID: number, name = DefaultChainName): Promise<number> {
  await ensureProjectAccess(userID, projectID)
  const chainNames = await getEntities(Entity.CHAIN, 'projectID', projectID)
  const uniqueName = await getUniqueName(
    name,
    chainNames.map(chain => chain.name)
  )
  const createdAt = new Date()
  const chainData = toChainData(projectID, uniqueName, [], createdAt, createdAt)
  await getDatastore().save(chainData)
  await updateProjectLastEditedAt(projectID)
  return getID(chainData)
}

export async function duplicateChainForUser(userID: number, chainID: number): Promise<number> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const newChainID = await addChainForUser(userID, chainData.projectID, chainData.name)
  await updateChainItems(userID, newChainID, JSON.parse(chainData.items))
  return newChainID
}

export async function updateChain(chainData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toChainData(
      chainData.projectID,
      chainData.name,
      JSON.parse(chainData.items),
      chainData.createdAt,
      updateLastEditedTimestamp ? new Date() : chainData.lastEditedAt,
      getID(chainData)
    )
  )
  if (updateLastEditedTimestamp) {
    await updateProjectLastEditedAt(chainData.projectID)
  }
}

export const getVerifiedUserChainData = async (userID: number, chainID: number) =>
  getVerifiedProjectScopedData(userID, Entity.CHAIN, chainID)

export async function ensureChainAccess(userID: number, chainID: number) {
  await getVerifiedUserChainData(userID, chainID)
}

export async function updateChainItems(userID: number, chainID: number, items: ChainItemWithInputs[]) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  await updateChain({ ...chainData, items: JSON.stringify(items) }, true)
}

export async function updateChainName(userID: number, chainID: number, name: string) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  await updateChain({ ...chainData, name }, true)
}

export async function deleteChainForUser(userID: number, chainID: number) {
  await ensureChainAccess(userID, chainID)

  const anyEndpointKey = await getEntityKey(Entity.ENDPOINT, 'parentID', chainID)
  if (anyEndpointKey) {
    throw new Error('Cannot delete chain with published endpoints')
  }
  
  await getDatastore().delete(buildKey(Entity.CHAIN, chainID))
}
