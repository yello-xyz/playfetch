import { and } from '@google-cloud/datastore'
import { Entity, buildFilter, buildKey, getDatastore, getEntities, getFilteredEntity, getID } from './datastore'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AvailableProvider, ModelProvider } from '@/types'

const getProviderData = (userID: number, provider: ModelProvider) =>
  getFilteredEntity(Entity.PROVIDER, and([buildFilter('userID', userID), buildFilter('provider', provider)]))

export async function getProviderKey(userID: number, provider: ModelProvider) {
  const providerData = await getProviderData(userID, provider)
  return providerData?.apiKey
}

export async function saveProviderKey(userID: number, provider: ModelProvider, apiKey: string | null) {
  const providerData = await getProviderData(userID, provider)
  await getDatastore().save({
    key: buildKey(Entity.PROVIDER, providerData && getID(providerData)),
    data: { userID, provider, apiKey, cost: 0 },
    excludeFromIndexes: ['apiKey'],
  })
}

export async function getAvailableProvidersForUser(userID: number): Promise<AvailableProvider[]> {
  const providerData = await getEntities(Entity.PROVIDER, 'userID', userID)
  const providerKeys: AvailableProvider[] = providerData
    .filter(data => !!data.apiKey?.length)
    .map(data => ({
      provider: data.provider,
      truncatedAPIKey: `${data.apiKey.slice(0, 8)}…${data.apiKey.slice(-4)}`,
    }))
  if (!providerKeys.find(key => key.provider === DefaultProvider)) {
    providerKeys.push({ provider: DefaultProvider })
  }
  return providerKeys
}
