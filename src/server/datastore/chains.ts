import {
  Entity,
  allocateID,
  buildKey,
  getDatastore,
  getEntities,
  getEntity,
  getEntityKey,
  getEntityKeys,
  getID,
  getKeyedEntity,
  getOrderedEntities,
  getTimestamp,
} from './datastore'
import { Chain, ChainItemWithInputs, InputValues, RawChainVersion } from '@/types'
import { ensureProjectAccess, updateProjectLastEditedAt } from './projects'
import { getUniqueName, getVerifiedProjectScopedData } from './prompts'
import { getTrustedParentInputValues } from './inputs'
import { addInitialVersion, saveChainVersionForUser, toUserVersions } from './versions'

export async function migrateChains(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))
  for (const chainData of allChains) {
    await datastore.save(
      toChainData(
        chainData.projectID,
        chainData.name,
        JSON.parse(chainData.references),
        chainData.createdAt,
        chainData.lastEditedAt,
        getID(chainData)
      )
    )
  }
}

type References = { [versionID: number]: number[] }

const toChainData = (
  projectID: number,
  name: string,
  references: References,
  createdAt: Date,
  lastEditedAt: Date,
  chainID: number
) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: {
    projectID,
    name,
    references: JSON.stringify(references),
    createdAt,
    lastEditedAt,
  },
  excludeFromIndexes: ['name', 'references'],
})

export const toChain = (data: any): Chain => ({
  id: getID(data),
  name: data.name,
  referencedItemIDs: [...new Set(Object.values(JSON.parse(data.references) as References).flat())],
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt'),
})

export async function getChainForUser(
  userID: number,
  chainID: number
): Promise<{ chain: Chain; versions: RawChainVersion[]; inputValues: InputValues }> {
  const chainData = await getVerifiedUserChainData(userID, chainID)

  const versions = await getOrderedEntities(Entity.VERSION, 'parentID', chainID)
  const runs = await getOrderedEntities(Entity.RUN, 'parentID', chainID)
  const comments = await getOrderedEntities(Entity.COMMENT, 'parentID', chainID)

  const inputValues = await getTrustedParentInputValues(chainID)

  return {
    chain: toChain(chainData),
    versions: toUserVersions(userID, versions, runs, comments) as RawChainVersion[],
    inputValues,
  }
}

const DefaultChainName = 'New Chain'

export async function addChainForUser(userID: number, projectID: number, name = DefaultChainName) {
  await ensureProjectAccess(userID, projectID)
  const chainNames = await getEntities(Entity.CHAIN, 'projectID', projectID)
  const uniqueName = await getUniqueName(
    name,
    chainNames.map(chain => chain.name)
  )
  const createdAt = new Date()
  const chainID = await allocateID(Entity.CHAIN)
  const versionData = await addInitialVersion(userID, chainID, true)
  const versionID = getID(versionData)
  const chainData = toChainData(projectID, uniqueName, { [versionID]: [] }, createdAt, createdAt, chainID)
  await getDatastore().save([chainData, versionData])
  updateProjectLastEditedAt(projectID)
  return { chainID: getID(chainData), versionID }
}

export async function duplicateChainForUser(userID: number, chainID: number): Promise<number> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const { chainID: newChainID, versionID } = await addChainForUser(userID, chainData.projectID, chainData.name)
  const versions = await getOrderedEntities(Entity.VERSION, 'parentID', chainID)
  const lastUserVersion = toUserVersions(userID, versions, [], []).slice(-1)[0] as RawChainVersion
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
      getID(chainData)
    )
  )
  if (updateLastEditedTimestamp) {
    updateProjectLastEditedAt(chainData.projectID)
  }
}

export const getVerifiedUserChainData = async (userID: number, chainID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.CHAIN], chainID)

export const getVerifiedUserPromptOrChainData = async (userID: number, parentID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.PROMPT, Entity.CHAIN], parentID)

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

export async function updateChainOnDeletedVersion(chainID: number, deletedVersionID: number) {
  const chainData = await getKeyedEntity(Entity.CHAIN, chainID)
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

  const versionKeys = await getEntityKeys(Entity.VERSION, 'parentID', chainID)
  const runKeys = await getEntityKeys(Entity.RUN, 'parentID', chainID)
  const commentKeys = await getEntityKeys(Entity.COMMENT, 'parentID', chainID)
  const inputKeys = await getEntityKeys(Entity.INPUT, 'parentID', chainID)
  const cacheKeys = await getEntityKeys(Entity.CACHE, 'parentID', chainID)
  await getDatastore().delete([
    ...cacheKeys,
    ...inputKeys,
    ...commentKeys,
    ...runKeys,
    ...versionKeys,
    buildKey(Entity.CHAIN, chainID),
  ])
}
