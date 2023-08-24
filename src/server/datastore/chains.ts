import {
  Entity,
  buildKey,
  getDatastore,
  getEntities,
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
import { saveChainVersionForUser, toVersion, toVersionData } from './versions'
import { updateEndpointForUser } from './endpoints'
import { toLogData } from './logs'

export async function migrateChains(postMerge: boolean) {
  const datastore = getDatastore()
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))
  for (const chainData of allChains) {
    let lastVersionID = chainData.lastVersionID
    const references = chainData.references ? JSON.parse(chainData.references) : {}
    if (!postMerge && chainData.items && !lastVersionID) {
      const items = JSON.parse(chainData.items) as ChainItemWithInputs[]
      const project = await getKeyedEntity(Entity.PROJECT, chainData.projectID)
      const workspace = await getKeyedEntity(Entity.WORKSPACE, project.workspaceID)
      const userID = workspace.userID
      const versionData = toVersionData(
        userID,
        getID(chainData),
        null,
        null,
        items,
        [],
        chainData.lastEditedAt,
        undefined,
        undefined,
        undefined
      )
      await datastore.save(versionData)
      lastVersionID = getID(versionData)
      references[lastVersionID] = items.flatMap(item => ('promptID' in item ? [item.promptID, item.versionID] : []))

      const endpoints = await getEntities(Entity.ENDPOINT, 'parentID', getID(chainData))
      for (const endpoint of endpoints) {
        await updateEndpointForUser(
          endpoint.userID,
          getID(endpoint),
          endpoint.enabled,
          endpoint.parentID,
          lastVersionID,
          endpoint.urlPath,
          endpoint.flavor,
          endpoint.useCache,
          endpoint.useStreaming
        )
      }

      const logs = await getEntities(Entity.LOG, 'parentID', getID(chainData))
      for (const log of logs) {
        datastore.save(
          toLogData(
            log.projectID,
            log.endpointID,
            log.urlPath,
            log.flavor,
            log.parentID,
            lastVersionID,
            JSON.parse(log.inputs),
            JSON.parse(log.output),
            log.error,
            log.createdAt,
            log.cost,
            log.duration,
            log.cacheHit,
            log.attempts,
            getID(log)
          )
        )
      }
    }
    await datastore.save(
      toChainData(
        chainData.projectID,
        chainData.name,
        lastVersionID,
        chainData.references ? JSON.parse(chainData.references) : references,
        chainData.createdAt,
        chainData.lastEditedAt,
        getID(chainData),
        postMerge && chainData.references ? undefined : chainData.items ? JSON.parse(chainData.items) : undefined
      )
    )
  }
}

type References = { [versionID: number]: number[] }

const toChainData = (
  projectID: number,
  name: string,
  lastVersionID: number,
  references: References,
  createdAt: Date,
  lastEditedAt: Date,
  chainID?: number,
  items?: ChainItemWithInputs[] // TODO safe to delete this after running next post-merge data migrations in prod
) => ({
  key: buildKey(Entity.CHAIN, chainID),
  data: {
    projectID,
    name,
    lastVersionID,
    references: JSON.stringify(references),
    createdAt,
    lastEditedAt,
    items: items ? JSON.stringify(items) : undefined,
  },
  excludeFromIndexes: ['name', 'items', 'references'], // TODO also delete items here
})

export const toChain = (data: any): Chain => ({
  id: getID(data),
  name: data.name,
  // lastVersionID: data.lastVersionID,
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
    versions: versions.map(version => toVersion(version, runs, comments) as RawChainVersion).reverse(),
    inputValues,
  }
}

export async function getChainItems(chainID: number): Promise<ChainItemWithInputs[]> {
  const chainData = await getKeyedEntity(Entity.CHAIN, chainID)
  return chainData ? JSON.parse(chainData.items) : []
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
  const chainData = toChainData(projectID, uniqueName, 0, {}, createdAt, createdAt)
  await getDatastore().save(chainData)
  const versionID = await saveChainVersionForUser(userID, getID(chainData))
  await updateProjectLastEditedAt(projectID)
  return { chainID: getID(chainData), versionID }
}

export async function duplicateChainForUser(userID: number, chainID: number): Promise<number> {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  const { chainID: newChainID, versionID } = await addChainForUser(userID, chainData.projectID, chainData.name)
  const lastVersion = await getKeyedEntity(Entity.VERSION, chainData.lastVersionID)
  await saveChainVersionForUser(userID, newChainID, JSON.parse(lastVersion.items), versionID)
  return newChainID
}

export async function updateChain(chainData: any, updateLastEditedTimestamp: boolean) {
  await getDatastore().save(
    toChainData(
      chainData.projectID,
      chainData.name,
      chainData.lastVersionID,
      JSON.parse(chainData.references),
      chainData.createdAt,
      updateLastEditedTimestamp ? new Date() : chainData.lastEditedAt,
      getID(chainData),
      chainData.items ? JSON.parse(chainData.items) : undefined
    )
  )
  if (updateLastEditedTimestamp) {
    await updateProjectLastEditedAt(chainData.projectID)
  }
}

export const getVerifiedUserChainData = async (userID: number, chainID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.CHAIN], chainID)

export const ensureChainAccess = (userID: number, chainID: number) => getVerifiedUserChainData(userID, chainID)

export const ensurePromptOrChainAccess = (userID: number, parentID: number) =>
  getVerifiedProjectScopedData(userID, [Entity.PROMPT, Entity.CHAIN], parentID)

export async function updateChainItems(userID: number, chainID: number, items: ChainItemWithInputs[]) {
  const chainData = await getVerifiedUserChainData(userID, chainID)
  await updateChain({ ...chainData, items: JSON.stringify(items) }, true)
}

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
  await updateChain({ ...chainData, lastVersionID: newVersionID, references: JSON.stringify(references) }, true)
}

export async function updateChainOnDeletedVersion(
  chainID: number,
  deletedVersionID: number,
  newLastVersionID: number
) {
  const chainData = await getKeyedEntity(Entity.PROMPT, chainID)
  const references = chainData.references ? JSON.parse(chainData.references) : {}
  references[deletedVersionID] = undefined
  await updateChain({ ...chainData, lastVersionID: newLastVersionID, references: JSON.stringify(references) }, true)
}

export async function deleteChainForUser(userID: number, chainID: number) {
  await ensureChainAccess(userID, chainID)

  const anyEndpointKey = await getEntityKey(Entity.ENDPOINT, 'parentID', chainID)
  if (anyEndpointKey) {
    throw new Error('Cannot delete chain with published endpoints')
  }

  const inputKeys = await getEntityKeys(Entity.INPUT, 'parentID', chainID)
  await getDatastore().delete([...inputKeys, buildKey(Entity.CHAIN, chainID)])
}
