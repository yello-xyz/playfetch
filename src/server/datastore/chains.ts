import {
  Entity,
  allocateID,
  buildKey,
  getDatastore,
  getEntities,
  getEntityKey,
  getID,
  getKeyedEntity,
  getOrderedEntities,
} from './datastore'
import { Chain, ChainItemWithInputs, InputValues, RawChainVersion } from '@/types'
import { ensureProjectAccess, updateProjectLastEditedAt } from './projects'
import { getTrustedProjectScopedData, getVerifiedProjectScopedData } from './prompts'
import { getTrustedParentInputValues, relinkInputValues } from './inputs'
import { addInitialVersion, saveChainVersionForUser, toUserVersions } from './versions'
import { getOrderedRunsForParentID } from './runs'
import { deleteEntity } from './cleanup'
import { GetUniqueName } from '@/src/common/formatting'

export async function migrateChains(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))
  for (const chainData of allChains) {
    await updateChain({ ...chainData }, false)
  }
}

type References = { [versionID: number]: number[] }

const toChainData = (
  projectID: number,
  name: string,
  references: References,
  createdAt: Date,
  lastEditedAt: Date,
  tableID: number | undefined,
  chainID: number
) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: {
    projectID,
    name,
    references: JSON.stringify(references),
    createdAt,
    lastEditedAt,
    tableID,
  },
  excludeFromIndexes: ['name', 'references'],
})

export const toChain = (data: any): Chain => ({
  id: getID(data),
  name: data.name,
  referencedItemIDs: [...new Set(Object.values(JSON.parse(data.references) as References).flat())],
  projectID: data.projectID,
  tableID: data.tableID ?? null,
})

export async function getChainForUser(
  userID: number,
  chainID: number
): Promise<{ chain: Chain; versions: RawChainVersion[]; inputValues: InputValues }> {
  const chainData = await getVerifiedUserChainData(userID, chainID)

  const versions = await getOrderedEntities(Entity.VERSION, 'parentID', chainID)
  const runs = await getOrderedRunsForParentID(chainID)

  const inputValues = await getTrustedParentInputValues(chainData.tableID ?? chainID)

  return {
    chain: toChain(chainData),
    versions: toUserVersions(userID, versions, runs) as RawChainVersion[],
    inputValues,
  }
}

const DefaultChainName = 'New Chain'

export async function addChainForUser(userID: number, projectID: number, name = DefaultChainName) {
  await ensureProjectAccess(userID, projectID)
  const chainNames = await getEntities(Entity.CHAIN, 'projectID', projectID)
  const uniqueName = GetUniqueName(
    name,
    chainNames.map(chain => chain.name)
  )
  const createdAt = new Date()
  const chainID = await allocateID(Entity.CHAIN)
  const versionData = await addInitialVersion(userID, chainID, 'chain')
  const versionID = getID(versionData)
  const chainData = toChainData(projectID, uniqueName, { [versionID]: [] }, createdAt, createdAt, undefined, chainID)
  await getDatastore().save([chainData, versionData])
  updateProjectLastEditedAt(projectID)
  return { chainID: getID(chainData), versionID }
}

export async function duplicateChainForUser(userID: number, chainID: number): Promise<number> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const { chainID: newChainID, versionID } = await addChainForUser(userID, chainData.projectID, chainData.name)
  const versions = await getOrderedEntities(Entity.VERSION, 'parentID', chainID)
  const lastUserVersion = toUserVersions(userID, versions, []).slice(-1)[0] as RawChainVersion
  await saveChainVersionForUser(userID, newChainID, lastUserVersion.items, versionID)
  return newChainID
}

export async function updateChain(chainData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toChainData(
      chainData.projectID,
      chainData.name,
      JSON.parse(chainData.references),
      chainData.createdAt,
      updateLastEditedTimestamp ? new Date() : chainData.lastEditedAt,
      chainData.tableID,
      getID(chainData)
    )
  )
  if (updateLastEditedTimestamp) {
    updateProjectLastEditedAt(chainData.projectID)
  }
}

export const getVerifiedUserChainData = async (userID: number, chainID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.CHAIN], chainID)

export const getVerifiedUserChain = (userID: number, chainID: number) =>
  getVerifiedUserChainData(userID, chainID).then(toChain)

export const getVerifiedUserPromptOrChainData = async (userID: number, parentID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.PROMPT, Entity.CHAIN], parentID)

export const getTrustedPromptOrChainData = async (parentID: number) =>
  getTrustedProjectScopedData([Entity.PROMPT, Entity.CHAIN], parentID)

export const ensureChainAccess = (userID: number, chainID: number) => getVerifiedUserChainData(userID, chainID)

export const ensurePromptOrChainAccess = (userID: number, parentID: number) =>
  getVerifiedUserPromptOrChainData(userID, parentID)

export async function updateChainName(userID: number, chainID: number, name: string) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  await updateChain({ ...chainData, name }, true)
}

export async function augmentChainDataWithNewVersion(
  chainData: any,
  newVersionID: number,
  newItems: ChainItemWithInputs[]
) {
  const references = chainData.references ? JSON.parse(chainData.references) : {}
  references[newVersionID] = newItems.flatMap(item => ('promptID' in item ? [item.promptID, item.versionID] : []))
  await updateChain({ ...chainData, references: JSON.stringify(references) }, true)
}

export async function updateChainOnDeletedVersion(chainData: any, deletedVersionID: number) {
  const references = chainData.references ? JSON.parse(chainData.references) : {}
  references[deletedVersionID] = undefined
  await updateChain({ ...chainData, references: JSON.stringify(references) }, true)
}

export async function deleteChainForUser(userID: number, chainID: number) {
  await ensureChainAccess(userID, chainID)
  const anyEndpointKey = await getEntityKey(Entity.ENDPOINT, 'parentID', chainID)
  if (anyEndpointKey) {
    throw new Error('Cannot delete chain with published endpoints')
  }
  await deleteEntity(Entity.CHAIN, chainID)
}

export const updateTableForChain = (userID: number, chainID: number, tableID: number | null | undefined) =>
  relinkInputValues(userID, chainID, tableID, getVerifiedUserChainData, data => updateChain(data, false))
