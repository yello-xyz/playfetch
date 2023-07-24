import {
  Entity,
  buildKey,
  getDatastore,
  getEntities,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
} from './datastore'
import { ActiveChain, Chain, ChainItem } from '@/types'
import { ensureProjectAccess, getProjectUsers, updateProjectLastEditedAt } from './projects'
import { getProjectInputValues } from './inputs'
import { getUniqueName, getVerifiedProjectScopedData, toPrompt } from './prompts'

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
  items: ChainItem[],
  inputs: string[],
  createdAt: Date,
  lastEditedAt: Date,
  chainID?: number
) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: {
    projectID,
    name,
    items: JSON.stringify(items),
    inputs: JSON.stringify(inputs),
    createdAt,
    lastEditedAt,
  },
  excludeFromIndexes: ['name', 'items', 'inputs'],
})

export const toChain = (data: any): Chain => ({
  id: getID(data),
  name: data.name,
  items: JSON.parse(data.items),
  inputs: JSON.parse(data.inputs),
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt'),
})

export async function getActiveChain(userID: number, chainID: number): Promise<ActiveChain> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const projectData = await getKeyedEntity(Entity.PROJECT, chainData.projectID)
  const users = await getProjectUsers(chainData.projectID)
  const inputValues = await getProjectInputValues(chainData.projectID)
  const promptData = await getOrderedEntities(Entity.PROMPT, 'projectID', chainData.projectID, ['lastEditedAt'])
  const prompts = promptData.map(toPrompt)

  return {
    ...toChain(chainData),
    projectID: chainData.projectID,
    users,
    inputValues,
    prompts,
    projectURLPath: projectData.urlPath ?? '',
  }
}

export async function getChainItems(chainID: number): Promise<ChainItem[]> {
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
  const chainData = toChainData(projectID, uniqueName, [], [], createdAt, createdAt)
  await getDatastore().save(chainData)
  await updateProjectLastEditedAt(projectID)
  return getID(chainData)
}

export async function duplicateChainForUser(userID: number, chainID: number): Promise<number> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const newChainID = await addChainForUser(userID, chainData.projectID, chainData.name)
  await updateChainItems(userID, newChainID, JSON.parse(chainData.items), JSON.parse(chainData.inputs))
  return newChainID
}

export async function updateChain(chainData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toChainData(
      chainData.projectID,
      chainData.name,
      JSON.parse(chainData.items),
      JSON.parse(chainData.inputs),
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

export async function updateChainItems(userID: number, chainID: number, items: ChainItem[], inputs: string[]) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  await updateChain({ ...chainData, items: JSON.stringify(items), inputs: JSON.stringify(inputs) }, true)
}

export async function updateChainName(userID: number, chainID: number, name: string) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  await updateChain({ ...chainData, name }, true)
}

export async function deleteChainForUser(userID: number, chainID: number) {
  // TODO warn or even refuse when chain has published endpoints
  await ensureChainAccess(userID, chainID)
  const endpointKeys = await getEntityKeys(Entity.ENDPOINT, 'parentID', chainID)
  const usageKeys = await getEntityKeys(Entity.USAGE, 'parentID', chainID)
  await getDatastore().delete([...usageKeys, ...endpointKeys, buildKey(Entity.CHAIN, chainID)])
}
