import { and } from '@google-cloud/datastore'
import { Entity, buildFilter, buildKey, getDatastore, getEntities, getFilteredEntity, getID } from './datastore'

const getProviderData = (userID: number, provider: string) =>
  getFilteredEntity(Entity.PROVIDER, and([buildFilter('userID', userID), buildFilter('provider', provider)]))

export async function getProviderKey(userID: number, provider: string) {
  const providerData = await getProviderData(userID, provider)
  return providerData?.apiKey
}

export async function updateProviderKey(userID: number, provider: string, apiKey: string | null) {
  const providerData = await getProviderData(userID, provider)
  await getDatastore().save({
    key: buildKey(Entity.PROVIDER, providerData && getID(providerData)),
    data: { userID, provider, apiKey, cost: 0 },
    excludeFromIndexes: ['apiKey'],
  })
}

export async function getAvailableProviders(userID: number) {
  const providerData = await getEntities(Entity.PROVIDER, 'userID', userID)
  return providerData.map(data => data.provider)
}
