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
import { ModelProviders } from '@/src/common/providerMetadata'

const buildProviderFilter = (scopeID: number, provider: ModelProvider | QueryProvider) =>
  and([buildFilter('scopeID', scopeID), buildFilter('provider', provider)])
const getProviderData = (scopeID: number, provider: ModelProvider | QueryProvider) =>
  getFilteredEntity(Entity.PROVIDER, buildProviderFilter(scopeID, provider))

type ProviderMetadata = {
  customModels?: CustomModel[]
  gatedModels?: DefaultLanguageModel[]
  environment?: string
}

export async function migrateProviders(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allProviders] = await datastore.runQuery(datastore.createQuery(Entity.PROVIDER))
  for (const providerData of allProviders) {
    await getDatastore().save(
      toProviderData(
        providerData.scopeID ?? providerData.userID,
        providerData.provider,
        providerData.apiKey,
        JSON.parse(providerData.metadata),
        providerData.cost,
        getID(providerData)
      )
    )
  }
}

export async function getProviderCredentials(
  scopeID: number,
  provider: ModelProvider | QueryProvider,
  modelToCheck?: string
): Promise<string[]> {
  const providerData = await getProviderData(scopeID, provider)
  const metadata = providerData ? (JSON.parse(providerData.metadata) as ProviderMetadata) : {}
  const customModels = metadata.customModels ?? []
  const gatedModels = metadata.gatedModels ?? []
  if (
    modelToCheck &&
    !(gatedModels as string[]).includes(modelToCheck) &&
    !customModels.find(model => model.id === modelToCheck && model.enabled)
  ) {
    return []
  }
  return [
    ...(providerData?.apiKey ? [providerData.apiKey] : []),
    ...(metadata.environment ? [metadata.environment] : []),
  ]
}

export async function getProviderKey(
  scopeID: number,
  provider: ModelProvider | QueryProvider,
  modelToCheck?: string
): Promise<string | null> {
  const [apiKey] = await getProviderCredentials(scopeID, provider, modelToCheck)
  return apiKey ?? null
}

const toProviderData = (
  scopeID: number,
  provider: ModelProvider | QueryProvider,
  apiKey: string | null,
  metadata: ProviderMetadata,
  cost: number,
  providerID?: number
) => ({
  key: buildKey(Entity.PROVIDER, providerID),
  data: {
    scopeID,
    provider,
    apiKey,
    metadata: JSON.stringify(metadata),
    cost,
  },
  excludeFromIndexes: ['apiKey', 'metadata'],
})

const toAvailableProvider = (data: any): AvailableProvider => {
  const metadata = JSON.parse(data.metadata) as ProviderMetadata
  return {
    provider: data.provider,
    cost: data.cost,
    ...(ModelProviders.includes(data.provider)
      ? { customModels: metadata.customModels ?? [], gatedModels: metadata.gatedModels ?? [] }
      : { environment: metadata.environment ?? '' }),
  }
}

export async function incrementProviderCostForUser(
  scopeID: number,
  provider: ModelProvider | QueryProvider,
  cost: number
) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const providerData = await getFilteredEntity(Entity.PROVIDER, buildProviderFilter(scopeID, provider), transaction)
    if (providerData) {
      transaction.save(
        toProviderData(
          scopeID,
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
  scopeID: number,
  provider: ModelProvider | QueryProvider,
  apiKey: string | null,
  environment: string | undefined
) {
  const providerData = await getProviderData(scopeID, provider)
  const providerID = providerData ? getID(providerData) : undefined
  await getDatastore().save(toProviderData(scopeID, provider, apiKey, { environment }, 0, providerID))
}

export async function saveProviderModel(
  scopeID: number,
  provider: ModelProvider,
  modelID: string,
  name: string,
  description: string,
  enabled: boolean
) {
  const providerData = await getProviderData(scopeID, provider)
  if (providerData) {
    const metadata = JSON.parse(providerData.metadata) as ProviderMetadata
    metadata.customModels = [
      ...(metadata.customModels ?? []).filter(model => model.id !== modelID),
      { id: modelID, name, description, enabled },
    ]
    await getDatastore().save(
      toProviderData(scopeID, provider, providerData.apiKey, metadata, providerData.cost, getID(providerData))
    )
  }
}

export async function getAvailableProvidersForUser(
  scopeID: number,
  reloadCustomModels = false
): Promise<AvailableProvider[]> {
  const providerData = await getEntities(Entity.PROVIDER, 'scopeID', scopeID)

  const availableProviders = [] as AvailableProvider[]
  const providerDataToSave = [] as any[]
  for (const availableProviderData of providerData.filter(data => !!data.apiKey?.length)) {
    const availableProvider =
      reloadCustomModels && ModelProviders.includes(availableProviderData.provider)
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
        availableProviderData.scopeID,
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
