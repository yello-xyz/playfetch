import { Entity, buildKey, getDatastore, getID, getKeyedEntity } from './datastore'

export async function migrateCache(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allCacheData] = await datastore.runQuery(datastore.createQuery(Entity.CACHE))
  for (const cacheData of allCacheData) {
    await datastore.save(
      toCacheData(
        cacheData.key,
        cacheData.value,
        Object.fromEntries(
          Object.entries(cacheData).filter(([key]) => !['key', 'value', 'createdAt', 'expiresAt'].includes(key))
        ),
        cacheData.createdAt,
        cacheData.expiresAt,
        getID(cacheData)
      )
    )
  }
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

export async function cacheExpiringValue(value: string, cacheID?: number, expirationTimeMilliseconds = 3600 * 1000) {
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

export async function cacheValueForKey(key: string, value: string, indices = {}) {
  await getDatastore().save(toCacheData(key, value, indices, new Date(), undefined, hashValue(key)))
}

export async function getCachedValueForKey(key: string) {
  const cacheData = await getKeyedEntity(Entity.CACHE, hashValue(key))
  return cacheData && cacheData.key === key ? cacheData.value : undefined
}

const hashValue = (value: string, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < value.length; i++) {
    ch = value.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}
