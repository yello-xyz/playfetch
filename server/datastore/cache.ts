import { Entity, buildKey, getDatastore, getKeyedEntity } from "./datastore"

export async function cacheValue(key: number, value: string) {
  await getDatastore().save({
    key: buildKey(Entity.CACHE, key),
    data: { value },
    excludeFromIndexes: ['value'],
  })
}

export async function getCachedValue(key: number) {
  const cachedValue = await getKeyedEntity(Entity.CACHE, key)
  return cachedValue ? cachedValue.value : undefined
}
