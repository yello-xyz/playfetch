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
import { ActiveChain, Chain, ChainItem } from '@/types'
import { ensureProjectAccess, getProjectUsers, updateProjectLastEditedAt } from './projects'
import { getProjectInputValues } from './inputs'
import { getVerifiedProjectScopedData, loadEndpoints, toPrompt } from './prompts'
import { ExtractPromptVariables } from '@/src/common/formatting'

export async function migrateChains() {
  const datastore = getDatastore()
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))
  for (const chainData of allChains) {
    const items = JSON.parse(chainData.items) as ChainItem[]
    const allInputs = [] as string[]
    for (const item of items) {
      if ('code' in item) {
        allInputs.push(...ExtractPromptVariables(item.code))
      } else {
        const versionData = await getKeyedEntity(Entity.VERSION, item.versionID)
        allInputs.push(...ExtractPromptVariables(versionData.prompt))
      }
    }
    const boundInputVariables = items.map(item => item.output).filter(output => !!output) as string[]
    const inputs = [...new Set(allInputs.filter(variable => !boundInputVariables.includes(variable)))]
    await updateChain({ ...chainData, inputs: JSON.stringify(inputs) }, false)
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

export async function getActiveChain(
  userID: number,
  chainID: number,
  buildURL: (path: string) => string
): Promise<ActiveChain> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const projectData = await getKeyedEntity(Entity.PROJECT, chainData.projectID)
  const users = await getProjectUsers(chainData.projectID)
  const inputValues = await getProjectInputValues(chainData.projectID)
  const endpoints = await loadEndpoints(chainID, projectData, buildURL)
  const promptData = await getOrderedEntities(Entity.PROMPT, 'projectID', chainData.projectID, ['lastEditedAt'])
  const prompts = promptData.map(toPrompt)

  return {
    ...toChain(chainData),
    projectID: chainData.projectID,
    endpoints,
    users,
    inputValues,
    prompts,
    projectURLPath: projectData.urlPath ?? '',
    availableFlavors: JSON.parse(projectData.flavors),
  }
}

export async function getChainItems(chainID: number): Promise<ChainItem[]> {
  const chainData = await getKeyedEntity(Entity.CHAIN, chainID)
  return chainData ? JSON.parse(chainData.items) : []
}

export const DefaultChainName = 'New Chain'

export async function addChainForUser(userID: number, projectID: number): Promise<number> {
  await ensureProjectAccess(userID, projectID)
  const createdAt = new Date()
  const chainData = toChainData(projectID, DefaultChainName, [], [], createdAt, createdAt)
  await getDatastore().save(chainData)
  await updateProjectLastEditedAt(projectID)
  return getID(chainData)
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
