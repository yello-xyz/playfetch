import { Key } from '@google-cloud/datastore'
import { Entity, buildKey, getDatastore, getEntityKeys, getID } from './datastore'

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
        await datastore.delete(buildKey(Entity.USAGE, entityID))
        await deleteBatchedEntities(Entity.LOG, 'endpointID', entityID)
        break
      case Entity.PROMPT:
      case Entity.CHAIN:
        await deleteBatchedEntities(Entity.CACHE, 'parentID', entityID)
        await deleteBatchedEntities(Entity.INPUT, 'parentID', entityID)
        await deleteBatchedEntities(Entity.COMMENT, 'parentID', entityID)
        await deleteBatchedEntities(Entity.RUN, 'parentID', entityID)
        await deleteBatchedEntities(Entity.VERSION, 'parentID', entityID)
        break
    }
  }

  await datastore.delete(allCleanupData.map(cleanupData => cleanupData[datastore.KEY]))
}

const deleteBatchedEntities = async (type: Entity, parentKey: string, parentID: number) => {
  while (true) {
    const entityKeys = await getEntityKeys(type, parentKey, parentID)
    if (entityKeys.length > 0) {
      await getDatastore().delete(entityKeys)
    } else {
      return
    }
  }
}
