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
import { AvailableModelProvider, AvailableProvider, CustomModel, ModelProvider, QueryProvider } from '@/types'
import { CustomModelsForProvider } from '../providers/integration'
import { AllModelProviders } from '@/src/common/providerMetadata'

const buildProviderFilter = (userID: number, provider: ModelProvider | QueryProvider) =>
  and([buildFilter('userID', userID), buildFilter('provider', provider)])
const getProviderData = (userID: number, provider: ModelProvider | QueryProvider) =>
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
        providerData.environment ?? null,
        providerData.cost,
        providerData.customModels ? JSON.parse(providerData.customModels) : [],
        getID(providerData)
      )
    )
  }
}

export async function getProviderCredentials(
  userID: number,
  provider: ModelProvider | QueryProvider,
  customModel?: string
): Promise<string[]> {
  const providerData = await getProviderData(userID, provider)
  const customModels = providerData ? (JSON.parse(providerData.customModels) as CustomModel[]) : []
  if (customModel && !customModels.find(model => model.id === customModel && model.enabled)) {
    return []
  }
  return [
    ...(providerData?.apiKey ? [providerData.apiKey] : []),
    ...(providerData?.environment ? [providerData.environment] : [])
  ]
}

export async function getProviderKey(
  userID: number,
  provider: ModelProvider | QueryProvider,
  customModel?: string
): Promise<string | null> {
  const [apiKey] = await getProviderCredentials(userID, provider, customModel)
  return apiKey ?? null
}

const toProviderData = (
  userID: number,
  provider: ModelProvider | QueryProvider,
  apiKey: string | null,
  environment: string | null,
  cost: number,
  customModels: CustomModel[],
  providerID?: number
) => ({
  key: buildKey(Entity.PROVIDER, providerID),
  data: { userID, provider, apiKey, environment, cost, customModels: JSON.stringify(customModels) },
  excludeFromIndexes: ['apiKey', 'environment', 'customModels'],
})

const toAvailableProvider = (data: any): AvailableProvider => ({
  provider: data.provider,
  cost: data.cost,
  ...(AllModelProviders.includes(data.provider) ? { customModels: JSON.parse(data.customModels) } : {}) 
})

export async function incrementProviderCostForUser(
  userID: number,
  provider: ModelProvider | QueryProvider,
  cost: number
) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const providerData = await getFilteredEntity(Entity.PROVIDER, buildProviderFilter(userID, provider), transaction)
    if (providerData) {
      transaction.save(
        toProviderData(
          userID,
          provider,
          providerData.apiKey,
          providerData.environment,
          providerData.cost + cost,
          JSON.parse(providerData.customModels),
          getID(providerData)
        )
      )
    }
  })
}

export async function saveProviderKey(
  userID: number,
  provider: ModelProvider | QueryProvider,
  apiKey: string | null,
  environment: string | null
) {
  const providerData = await getProviderData(userID, provider)
  const providerID = providerData ? getID(providerData) : undefined
  await getDatastore().save(toProviderData(userID, provider, apiKey, environment, 0, [], providerID))
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
      toProviderData(
        userID,
        provider,
        providerData.apiKey,
        providerData.environment,
        providerData.cost,
        newCustomModels,
        getID(providerData)
      )
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
    const availableProvider = reloadCustomModels && AllModelProviders.includes(availableProviderData.provider)
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
  const currentCustomModels = await CustomModelsForProvider(
    availableProviderData.provider as ModelProvider,
    availableProviderData.apiKey
  )
  const filteredCustomModels = previousCustomModels.filter(model => currentCustomModels.includes(model.id))
  if (filteredCustomModels.length < previousCustomModels.length) {
    providerDataToSave.push(
      toProviderData(
        availableProviderData.userID,
        availableProviderData.provider,
        availableProviderData.apiKey,
        availableProviderData.environment,
        availableProviderData.cost,
        filteredCustomModels,
        getID(availableProviderData)
      )
    )
  }
  const additionalModels = currentCustomModels.filter(
    model => !previousCustomModels.find(previous => previous.id === model)
  )
  const availableProvider = toAvailableProvider(availableProviderData) as AvailableModelProvider
  availableProvider.customModels = [
    ...filteredCustomModels,
    ...additionalModels.map(model => ({ id: model, name: '', description: '', enabled: false })),
  ]
  return availableProvider
}
