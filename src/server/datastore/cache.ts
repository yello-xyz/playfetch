import HashValue from '@/src/common/hashing'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity } from './datastore'

export async function migrateCache(postMerge: boolean) {
  if (!postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allCacheData] = await datastore.runQuery(datastore.createQuery(Entity.CACHE))
  const usedParentIDs = new Set(allCacheData.map(cacheData => cacheData.parentID))
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  const [allChains] = await datastore.runQuery(datastore.createQuery(Entity.CHAIN))
  const allParentIDs = new Set([...allPrompts.map(prompt => getID(prompt)), ...allChains.map(chain => getID(chain))])
  console.log(`Found ${allCacheData.length} cache keys (for ${usedParentIDs.size} parents out of ${allParentIDs.size})`)
  for (const cacheData of allCacheData) {
    if (!!cacheData.parentID && !allParentIDs.has(cacheData.parentID)) {
      console.log(`Deleting cache key ${getID(cacheData)} for missing parent ${cacheData.parentID}`)
      await datastore.delete(buildKey(Entity.CACHE, getID(cacheData)))
    }
  }
  // for (const cacheData of allCacheData) {
  //   await datastore.save(
  //     toCacheData(
  //       cacheData.key,
  //       cacheData.value,
  //       Object.fromEntries(
  //         Object.entries(cacheData).filter(([key]) => !['key', 'value', 'createdAt', 'expiresAt'].includes(key))
  //       ),
  //       cacheData.createdAt,
  //       cacheData.expiresAt,
  //       getID(cacheData)
  //     )
  //   )
  // }
}

const toCacheData = (
  key: string | undefined,
  value: string,
  attributes = {},
  createdAt: Date,
  expiresAt?: Date,
  cacheID?: number
) => ({
  key: buildKey(Entity.CACHE, cacheID),
  data: { ...attributes, key, value, createdAt, expiresAt },
  excludeFromIndexes: ['key', 'value'],
})

export async function cacheExpiringValue(
  value: string,
  cacheID?: number,
  expirationTimeMilliseconds = 24 * 3600 * 1000
) {
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + expirationTimeMilliseconds)
  const cacheData = toCacheData(undefined, value, undefined, createdAt, expiresAt, cacheID)
  await getDatastore().save(cacheData)
  return getID(cacheData)
}

export async function getExpiringCachedValue(cacheID: number) {
  const cacheData = await getKeyedEntity(Entity.CACHE, cacheID)
  return cacheData && new Date() < cacheData.expiresAt ? cacheData.value : undefined
}

export async function cacheValue(value: string, cacheID?: number, indices = {}) {
  const cacheData = toCacheData(undefined, value, indices, new Date(), undefined, cacheID)
  await getDatastore().save(cacheData)
  return getID(cacheData)
}

export async function getCachedValue(cacheID: number) {
  const cacheData = await getKeyedEntity(Entity.CACHE, cacheID)
  return cacheData?.value
}

export const cacheValueForKey = (key: string, value: string, indices = {}) =>
  getDatastore().save(toCacheData(key, value, indices, new Date(), undefined, HashValue(key)))

export async function getCachedValueForKey(key: string) {
  const cacheData = await getKeyedEntity(Entity.CACHE, HashValue(key))
  return cacheData && cacheData.key === key ? cacheData.value : undefined
}
