import { Key } from '@google-cloud/datastore'
import { Entity, buildKey, getDatastore, getEntityKey, getEntityKeys, getID, getKeyedEntity } from './datastore'

export async function migrateCleanup(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allCleanupData] = await datastore.runQuery(datastore.createQuery(Entity.CLEANUP))
  for (const cleanupData of allCleanupData) {
    await datastore.save(toCleanupData(getID(cleanupData), cleanupData.entity, cleanupData.createdAt))
  }
}

const toCleanupData = (entityID: number, entity: Entity, createdAt: Date) => ({
  key: buildKey(Entity.CLEANUP, entityID),
  data: { entity, createdAt },
  excludeFromIndexes: [],
})

export const deleteEntity = (type: Entity, id: number) => deleteEntities([buildKey(type, id)])

export const deleteEntities = async (entityKeys: Key[]) => {
  const datastore = getDatastore()
  datastore.save(entityKeys.map(key => toCleanupData(getID({ key }), key.kind as Entity, new Date())))
  await datastore.delete(entityKeys)
}

export default async function cleanUpEntities() {
  const datastore = getDatastore()
  const [allCleanupData] = await datastore.runQuery(
    datastore.createQuery(Entity.CLEANUP).order('createdAt', { descending: false })
  )

  for (const cleanupData of allCleanupData) {
    const entityID = getID(cleanupData)
    switch (cleanupData.entity) {
      case Entity.ENDPOINT:
        await deleteSingleEntity(Entity.USAGE, entityID)
        await deleteBatchedEntities(Entity.LOG, 'endpointID', entityID)
        break
      case Entity.VERSION:
        await deleteBatchedEntities(Entity.CACHE, 'versionID', entityID)
        await deleteBatchedEntities(Entity.COMMENT, 'versionID', entityID)
        await deleteBatchedEntities(Entity.RUN, 'versionID', entityID)
        break
      case Entity.PROMPT:
      case Entity.CHAIN:
        await deleteSingleEntity(Entity.RATING, entityID)
        await deleteBatchedEntities(Entity.CACHE, 'parentID', entityID)
        await deleteBatchedEntities(Entity.INPUT, 'parentID', entityID)
        await deleteBatchedEntities(Entity.COMMENT, 'parentID', entityID)
        await deleteBatchedEntities(Entity.RUN, 'parentID', entityID)
        await deleteBatchedEntities(Entity.VERSION, 'parentID', entityID)
        break
      case Entity.PROJECT:
        await deleteSingleEntity(Entity.BUDGET, entityID)
        await deleteBatchedEntities(Entity.COST, 'scopeID', entityID)
        await deleteBatchedEntities(Entity.PROVIDER, 'scopeID', entityID)
        await deleteBatchedEntities(Entity.ACCESS, 'objectID', entityID)
        await deleteBatchedEntities(Entity.ENDPOINT, 'projectID', entityID)
        await deleteBatchedEntities(Entity.USAGE, 'projectID', entityID)
        await deleteBatchedEntities(Entity.LOG, 'projectID', entityID)
        await deleteBatchedEntities(Entity.ANALYTICS, 'projectID', entityID)
        await deleteBatchedEntities(Entity.COMMENT, 'projectID', entityID)
        await cleanUpBatchedEntities(Entity.PROMPT, 'projectID', entityID)
        await cleanUpBatchedEntities(Entity.CHAIN, 'projectID', entityID)
        break
      case Entity.WORKSPACE:
        await deleteBatchedEntities(Entity.ACCESS, 'objectID', entityID)
        await cleanUpBatchedEntities(Entity.PROJECT, 'workspaceID', entityID)
        break
    }
  }

  await datastore.delete(allCleanupData.map(cleanupData => cleanupData[datastore.KEY]))
}

const deleteSingleEntity = async (type: Entity, entityID: number) => {
  const entity = await getKeyedEntity(type, entityID)
  if (entity) {
    console.log(`Deleting ${type} entity with ID ${entityID}…`)
    await getDatastore().delete(buildKey(type, entityID))
  }
}

const deleteBatchedEntities = async (type: Entity, parentKey: string, parentID: number) => {
  while (true) {
    const entityKeys = await getEntityKeys(type, parentKey, parentID)
    if (entityKeys.length > 0) {
      console.log(`Deleting ${entityKeys.length} ${type} entities for ${parentKey} ${parentID}…`)
      await getDatastore().delete(entityKeys)
    } else {
      return
    }
  }
}

const cleanUpBatchedEntities = async (type: Entity, parentKey: string, parentID: number) => {
  while (true) {
    const entityKeys = await getEntityKeys(type, parentKey, parentID)
    if (entityKeys.length > 0) {
      console.log(`Cleaning up ${entityKeys.length} ${type} entities for ${parentKey} ${parentID}…`)
      await deleteEntities(entityKeys)
    } else {
      return
    }
  }
}
