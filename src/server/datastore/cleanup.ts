import { Key } from '@google-cloud/datastore'
import { Entity, buildKey, getDatastore, getID } from './datastore'

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

export default async function cleanupEntities() {
  const datastore = getDatastore()
  const [allCleanupData] = await datastore.runQuery(
    datastore.createQuery(Entity.CLEANUP).order('createdAt', { descending: false })
  )

  for (const cleanupData of allCleanupData) {
  }
  
  await datastore.delete(allCleanupData)
}
