import { Entity, buildKey, getDatastore, getID, getKeyedEntity } from './datastore'

export async function migrateCache(postMerge: boolean) {
  const datastore = getDatastore()
  const [allCacheData] = await datastore.runQuery(datastore.createQuery(Entity.CACHE))
  for (const cacheData of allCacheData) {
    if (postMerge && !cacheData.key) {
      await datastore.delete(buildKey(Entity.CACHE, getID(cacheData)))
    }
  }
}

export async function cacheValue(key: string, value: string, indices = {}) {
  await getDatastore().save({
    key: buildKey(Entity.CACHE, hashValue(key)),
    data: { ...indices, key, value, createdAt: new Date() },
    excludeFromIndexes: ['key', 'value'],
  })
}

export async function getCachedValue(key: string) {
  const cachedValue = await getKeyedEntity(Entity.CACHE, hashValue(key))
  return cachedValue && cachedValue.key === key ? cachedValue.value : undefined
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
