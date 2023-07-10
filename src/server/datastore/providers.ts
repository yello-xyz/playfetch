import { and } from '@google-cloud/datastore'
import {
  Entity,
  buildFilter,
  buildKey,
  getDatastore,
  getEntities,
  getFilteredEntity,
  getID,
  runTransactionWithExponentialBackoff,
} from './datastore'
import { DefaultProvider } from '@/src/common/defaultConfig'
import { AvailableProvider, ModelProvider } from '@/types'

const buildProviderFilter = (userID: number, provider: ModelProvider) =>
  and([buildFilter('userID', userID), buildFilter('provider', provider)])
const getProviderData = (userID: number, provider: ModelProvider) =>
  getFilteredEntity(Entity.PROVIDER, buildProviderFilter(userID, provider))

export async function getProviderKey(userID: number, provider: ModelProvider): Promise<string | null> {
  const providerData = await getProviderData(userID, provider)
  return providerData?.apiKey ?? null
}

const toProviderData = (
  userID: number,
  provider: ModelProvider,
  apiKey: string | null,
  cost: number,
  providerID?: number
) => ({
  key: buildKey(Entity.PROVIDER, providerID),
  data: { userID, provider, apiKey, cost },
  excludeFromIndexes: ['apiKey'],
})

export async function incrementProviderCostForUser(userID: number, provider: ModelProvider, cost: number) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const query = transaction.createQuery(Entity.PROVIDER).filter(buildProviderFilter(userID, provider)).limit(1)
    const [[providerData]] = await transaction.runQuery(query)
    transaction.save(
      toProviderData(
        userID,
        provider,
        providerData.apiKey,
        providerData.cost + cost,
        getID(providerData)
      )
    )
  })
}

export async function saveProviderKey(userID: number, provider: ModelProvider, apiKey: string | null) {
  const providerData = await getProviderData(userID, provider)
  await getDatastore().save(toProviderData(userID, provider, apiKey, providerData?.cost ?? 0, providerData?.id))
}

export async function getAvailableProvidersForUser(userID: number): Promise<AvailableProvider[]> {
  const providerData = await getEntities(Entity.PROVIDER, 'userID', userID)
  const providerKeys: AvailableProvider[] = providerData
    .filter(data => !!data.apiKey?.length)
    .map(data => ({
      provider: data.provider,
      truncatedAPIKey: `${data.apiKey.slice(0, 8)}…${data.apiKey.slice(-4)}`,
      cost: data.cost,
    }))
  if (!providerKeys.find(key => key.provider === DefaultProvider)) {
    providerKeys.push({ provider: DefaultProvider, cost: 0 })
  }
  return providerKeys
}
