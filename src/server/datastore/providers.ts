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
import {
  AvailableModelProvider,
  AvailableProvider,
  CustomModel,
  DefaultLanguageModel,
  ModelProvider,
  QueryProvider,
} from '@/types'
import { ExtraModelsForProvider } from '../providers/integration'
import { AllModelProviders } from '@/src/common/providerMetadata'

const buildProviderFilter = (userID: number, provider: ModelProvider | QueryProvider) =>
  and([buildFilter('userID', userID), buildFilter('provider', provider)])
const getProviderData = (userID: number, provider: ModelProvider | QueryProvider) =>
  getFilteredEntity(Entity.PROVIDER, buildProviderFilter(userID, provider))

type ProviderMetadata = {
  customModels?: CustomModel[]
  gatedModels?: DefaultLanguageModel[]
  environment?: string
}

export async function migrateProviders(postMerge: boolean) {
  const datastore = getDatastore()
  const [allProviders] = await datastore.runQuery(datastore.createQuery(Entity.PROVIDER))
  for (const providerData of allProviders) {
    const metadata: ProviderMetadata = postMerge ? JSON.parse(providerData.metadata) : {}
    if (!postMerge) {
      const customModels = JSON.parse(providerData.customModels) as CustomModel[]
      if (customModels.length > 0) {
        metadata.customModels = customModels
      }
      const environment = providerData.environment as string | null
      if (environment !== null) {
        metadata.environment = environment
      }
    }
    await getDatastore().save(
      toProviderData(
        providerData.userID,
        providerData.provider,
        providerData.apiKey,
        metadata,
        providerData.cost,
        getID(providerData),
        postMerge ? undefined : providerData.environment,
        postMerge ? undefined : JSON.parse(providerData.customModels)
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
  const metadata = providerData ? (JSON.parse(providerData.metadata) as ProviderMetadata) : {}
  const customModels = metadata.customModels ?? []
  if (customModel && !customModels.find(model => model.id === customModel && model.enabled)) {
    return []
  }
  return [
    ...(providerData?.apiKey ? [providerData.apiKey] : []),
    ...(metadata.environment ? [metadata.environment] : []),
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
  metadata: ProviderMetadata,
  cost: number,
  providerID?: number,
  environment?: string | null,
  customModels?: CustomModel[]
) => ({
  key: buildKey(Entity.PROVIDER, providerID),
  data: {
    userID,
    provider,
    apiKey,
    metadata: JSON.stringify(metadata),
    cost,
    environment,
    customModels: customModels ? JSON.stringify(customModels) : customModels,
  },
  excludeFromIndexes: ['apiKey', 'metadata', 'environment', 'customModels'], // TODO remove environment/customModels after push
})

const toAvailableProvider = (data: any): AvailableProvider => {
  const metadata = JSON.parse(data.metadata) as ProviderMetadata
  return {
    provider: data.provider,
    cost: data.cost,
    ...(AllModelProviders.includes(data.provider)
      ? { customModels: metadata.customModels ?? [], gatedModels: metadata.gatedModels ?? [] }
      : { environment: metadata.environment ?? '' }),
  }
}

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
          JSON.parse(providerData.metadata),
          providerData.cost + cost,
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
  environment: string | undefined
) {
  const providerData = await getProviderData(userID, provider)
  const providerID = providerData ? getID(providerData) : undefined
  await getDatastore().save(toProviderData(userID, provider, apiKey, { environment }, 0, providerID))
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
    const metadata = JSON.parse(providerData.metadata) as ProviderMetadata
    metadata.customModels = [
      ...(metadata.customModels ?? []).filter(model => model.id !== modelID),
      { id: modelID, name, description, enabled },
    ]
    await getDatastore().save(
      toProviderData(userID, provider, providerData.apiKey, metadata, providerData.cost, getID(providerData))
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
    const availableProvider =
      reloadCustomModels && AllModelProviders.includes(availableProviderData.provider)
        ? await loadProviderWithCustomModels(availableProviderData, providerDataToSave)
        : toAvailableProvider(availableProviderData)
    availableProviders.push(availableProvider)
  }
  if (providerDataToSave.length > 0) {
    await getDatastore().save(providerDataToSave)
  }

  if (!availableProviders.find(key => key.provider === DefaultProvider)) {
    availableProviders.push({ provider: DefaultProvider, cost: 0, customModels: [], gatedModels: [] })
  }

  return availableProviders
}

async function loadProviderWithCustomModels(availableProviderData: any, providerDataToSave: any[]) {
  const previousMetadata = JSON.parse(availableProviderData.metadata) as ProviderMetadata
  const previousCustomModels = previousMetadata.customModels ?? []
  const previousGatedModels = previousMetadata.gatedModels ?? []
  const { customModels: currentCustomModels, gatedModels: currentGatedModels } = await ExtraModelsForProvider(
    availableProviderData.provider as ModelProvider,
    availableProviderData.apiKey
  )
  const filteredCustomModels = previousCustomModels.filter(model => currentCustomModels.includes(model.id))
  const differentGatedModels =
    currentGatedModels.some(model => !previousGatedModels.includes(model)) ||
    previousGatedModels.some(model => !currentGatedModels.includes(model))
  if (filteredCustomModels.length < previousCustomModels.length || differentGatedModels) {
    providerDataToSave.push(
      toProviderData(
        availableProviderData.userID,
        availableProviderData.provider,
        availableProviderData.apiKey,
        { ...previousMetadata, customModels: filteredCustomModels, gatedModels: currentGatedModels },
        availableProviderData.cost,
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
  availableProvider.gatedModels = currentGatedModels
  return availableProvider
}
