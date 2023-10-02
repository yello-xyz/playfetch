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
import { AvailableProvider, CustomModel, ModelProvider } from '@/types'
import { FineTunedModelsForProvider } from '../providers/integration'

const buildProviderFilter = (userID: number, provider: ModelProvider) =>
  and([buildFilter('userID', userID), buildFilter('provider', provider)])
const getProviderData = (userID: number, provider: ModelProvider) =>
  getFilteredEntity(Entity.PROVIDER, buildProviderFilter(userID, provider))

export async function migrateProviders(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allProviders] = await datastore.runQuery(datastore.createQuery(Entity.PROVIDER))
  for (const providerData of allProviders) {
    await getDatastore().save(
      toProviderData(
        providerData.userID,
        providerData.provider,
        providerData.apiKey,
        providerData.cost,
        providerData.customModels ? JSON.parse(providerData.customModels) : [],
        getID(providerData)
      )
    )
  }
}

export async function getProviderKey(userID: number, provider: ModelProvider): Promise<string | null> {
  const providerData = await getProviderData(userID, provider)
  return providerData?.apiKey ?? null
}

const toProviderData = (
  userID: number,
  provider: ModelProvider,
  apiKey: string | null,
  cost: number,
  customModels: CustomModel[],
  providerID?: number
) => ({
  key: buildKey(Entity.PROVIDER, providerID),
  data: { userID, provider, apiKey, cost, customModels: JSON.stringify(customModels) },
  excludeFromIndexes: ['apiKey', 'customModels'],
})

const toAvailableProvider = (data: any): AvailableProvider => ({
  provider: data.provider,
  cost: data.cost,
  customModels: JSON.parse(data.customModels),
})

export async function incrementProviderCostForUser(userID: number, provider: ModelProvider, cost: number) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const providerData = await getFilteredEntity(Entity.PROVIDER, buildProviderFilter(userID, provider), transaction)
    if (providerData) {
      transaction.save(
        toProviderData(
          userID,
          provider,
          providerData.apiKey,
          providerData.cost + cost,
          JSON.parse(providerData.customModels),
          getID(providerData)
        )
      )
    }
  })
}

export async function saveProviderKey(userID: number, provider: ModelProvider, apiKey: string | null) {
  const providerData = await getProviderData(userID, provider)
  const providerID = providerData ? getID(providerData) : undefined
  await getDatastore().save(toProviderData(userID, provider, apiKey, 0, [], providerID))
}

export async function saveProviderModel(
  userID: number,
  provider: ModelProvider,
  modelID: string,
  name: string,
  description: string,
  enabled: boolean
) {
  const providerData = await getProviderData(userID, provider)
  if (providerData) {
    const customModels = JSON.parse(providerData.customModels) as CustomModel[]
    const newCustomModels = [
      ...customModels.filter(model => model.id !== modelID),
      { id: modelID, name, description, enabled },
    ]
    await getDatastore().save(
      toProviderData(userID, provider, providerData.apiKey, providerData.cost, newCustomModels, getID(providerData))
    )
  }
}

export async function getAvailableProvidersForUser(
  userID: number,
  reloadCustomModels = false
): Promise<AvailableProvider[]> {
  const providerData = await getEntities(Entity.PROVIDER, 'userID', userID)

  const availableProviders = [] as AvailableProvider[]
  const providerDataToSave = [] as any[]
  for (const availableProviderData of providerData.filter(data => !!data.apiKey?.length)) {
    const availableProvider = reloadCustomModels
      ? await loadProviderWithCustomModels(availableProviderData, providerDataToSave)
      : toAvailableProvider(availableProviderData)
    availableProviders.push(availableProvider)
  }
  if (providerDataToSave.length > 0) {
    await getDatastore().save(providerDataToSave)
  }

  if (!availableProviders.find(key => key.provider === DefaultProvider)) {
    availableProviders.push({ provider: DefaultProvider, cost: 0, customModels: [] })
  }

  return availableProviders
}

async function loadProviderWithCustomModels(availableProviderData: any, providerDataToSave: any[]) {
  const previousCustomModels = JSON.parse(availableProviderData.customModels) as CustomModel[]
  const currentCustomModels = await FineTunedModelsForProvider(
    availableProviderData.provider,
    availableProviderData.apiKey
  )
  const filteredCustomModels = previousCustomModels.filter(
    model => !!currentCustomModels.find(current => current.id === model.id)
  )
  if (filteredCustomModels.length < previousCustomModels.length) {
    providerDataToSave.push(
      toProviderData(
        availableProviderData.userID,
        availableProviderData.provider,
        availableProviderData.apiKey,
        availableProviderData.cost,
        filteredCustomModels,
        getID(availableProviderData)
      )
    )
  }
  const additionalModels = currentCustomModels.filter(
    model => !previousCustomModels.find(previous => previous.id === model.id)
  )
  const availableProvider = toAvailableProvider(availableProviderData)
  availableProvider.customModels = [
    ...filteredCustomModels,
    ...additionalModels.map(model => ({ id: model.id, name: '', description: '', enabled: false })),
  ]
  return availableProvider
}
