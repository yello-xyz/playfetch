import { PropertyFilter, and } from '@google-cloud/datastore'
import { Entity, buildFilter, buildKey, decrypt, encrypt, getDatastore, getFilteredEntities, getID } from './datastore'
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
import { EntityFilter } from '@google-cloud/datastore/build/src/filter'
import { SortAndFilterProviderData } from '../providers/cascade'
import { ensureProjectOwnership } from './projects'

const getFilteredProviderData = (filter: EntityFilter, scopeIDs: number[]) =>
  getFilteredEntities(Entity.PROVIDER, filter).then(SortAndFilterProviderData(scopeIDs))

const buildScopeFilter = (scopeIDs: number[]) => new PropertyFilter('scopeID', 'IN', scopeIDs)
const getMultipleProviderData = (scopeIDs: number[]) => getFilteredProviderData(buildScopeFilter(scopeIDs), scopeIDs)

const buildSingleProviderFilter = (scopeIDs: number[], provider: ModelProvider | QueryProvider) =>
  and([buildScopeFilter(scopeIDs), buildFilter('provider', provider)])
const getSingleProviderData = (scopeIDs: number[], provider: ModelProvider | QueryProvider) =>
  getFilteredProviderData(buildSingleProviderFilter(scopeIDs, provider), scopeIDs).then(([entity]) => entity)

type ProviderMetadata = {
  customModels?: CustomModel[]
  gatedModels?: DefaultLanguageModel[]
  environment?: string
}

export async function migrateProviders(postMerge: boolean) {
  const datastore = getDatastore()
  const [allProviders] = await datastore.runQuery(datastore.createQuery(Entity.PROVIDER))
  for (const providerData of allProviders) {
    await getDatastore().save(
      toProviderData(
        providerData.scopeID,
        providerData.provider,
        postMerge
          ? providerData.encryptedAPIKey
          : providerData.apiKey
            ? encrypt(providerData.apiKey)
            : providerData.encryptedAPIKey,
        JSON.parse(providerData.metadata),
        providerData.createdAt,
        getID(providerData),
        postMerge && providerData.encryptedAPIKey ? undefined : providerData.apiKey
      )
    )
  }
}

export async function getProviderCredentials(
  scopeIDs: number[],
  provider: ModelProvider | QueryProvider,
  modelToCheck?: string
): Promise<{ scopeID: number | null; providerID: number | null; apiKey: string | null; environment: string | null }> {
  const providerData = await getSingleProviderData(scopeIDs, provider)
  const metadata = providerData ? (JSON.parse(providerData.metadata) as ProviderMetadata) : {}
  const customModels = metadata.customModels ?? []
  const gatedModels = metadata.gatedModels ?? []
  if (
    modelToCheck &&
    !(gatedModels as string[]).includes(modelToCheck) &&
    !customModels.find(model => model.id === modelToCheck && model.enabled)
  ) {
    return { scopeID: null, providerID: null, apiKey: null, environment: null }
  }
  return {
    scopeID: providerData?.scopeID ?? null,
    providerID: providerData ? getID(providerData) : null,
    apiKey: providerData?.encryptedAPIKey ? decrypt(providerData.encryptedAPIKey) : null,
    environment: metadata.environment ?? null,
  }
}

const toProviderData = (
  scopeID: number,
  provider: ModelProvider | QueryProvider,
  encryptedAPIKey: string | null,
  metadata: ProviderMetadata,
  createdAt = new Date(),
  providerID?: number,
  apiKey?: string | null // TODO delete after next merge to prod (also in exludedFromIndexes)
) => ({
  key: buildKey(Entity.PROVIDER, providerID),
  data: {
    createdAt,
    scopeID,
    provider,
    encryptedAPIKey,
    metadata: JSON.stringify(metadata),
    apiKey,
  },
  excludeFromIndexes: ['encryptedAPIKey', 'metadata', 'apiKey'],
})

const toAvailableProvider = (data: any): AvailableProvider => {
  const metadata = JSON.parse(data.metadata) as ProviderMetadata
  return {
    provider: data.provider,
    ...(ModelProviders.includes(data.provider)
      ? { customModels: metadata.customModels ?? [], gatedModels: metadata.gatedModels ?? [] }
      : { environment: metadata.environment ?? '' }),
  }
}

export const ensureScopeOwnership = async (userID: number, scopeID: number) =>
  scopeID === userID ? Promise.resolve() : ensureProjectOwnership(userID, scopeID)

export async function saveProviderKey(
  userID: number,
  scopeID: number,
  provider: ModelProvider | QueryProvider,
  apiKey: string | null,
  environment: string | undefined
) {
  await ensureScopeOwnership(userID, scopeID)
  const providerData = await getSingleProviderData([scopeID], provider)
  const providerID = providerData ? getID(providerData) : undefined
  const encryptedAPIKey = apiKey ? encrypt(apiKey) : null
  await getDatastore().save(
    toProviderData(scopeID, provider, encryptedAPIKey, { environment }, providerData?.createdAt, providerID)
  )
}

export async function saveProviderModel(
  userID: number,
  scopeID: number,
  provider: ModelProvider,
  modelID: string,
  name: string,
  description: string,
  enabled: boolean
) {
  await ensureScopeOwnership(userID, scopeID)
  const providerData = await getSingleProviderData([scopeID], provider)
  if (providerData) {
    const metadata = JSON.parse(providerData.metadata) as ProviderMetadata
    metadata.customModels = [
      ...(metadata.customModels ?? []).filter(model => model.id !== modelID),
      { id: modelID, name, description, enabled },
    ]
    await getDatastore().save(
      toProviderData(
        scopeID,
        provider,
        providerData.encryptedAPIKey,
        metadata,
        providerData.createdAt,
        getID(providerData)
      )
    )
  }
}

export const loadScopedProviders = (scopeID: number) => getProvidersForScopes([scopeID], true)
export const loadAvailableProviders = (scopeIDs: number[]) => getProvidersForScopes(scopeIDs, false)

async function getProvidersForScopes(scopeIDs: number[], reloadCustomModels = false): Promise<AvailableProvider[]> {
  const providerData = await getMultipleProviderData(scopeIDs)

  const availableProviders = [] as AvailableProvider[]
  const providerDataToSave = [] as any[]
  for (const availableProviderData of providerData.filter(data => !!data.encryptedAPIKey?.length)) {
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
    availableProviders.push({ provider: DefaultProvider, customModels: [], gatedModels: [] })
  }

  return availableProviders
}

async function loadProviderWithCustomModels(availableProviderData: any, providerDataToSave: any[]) {
  const previousMetadata = JSON.parse(availableProviderData.metadata) as ProviderMetadata
  const previousCustomModels = previousMetadata.customModels ?? []
  const previousGatedModels = previousMetadata.gatedModels ?? []
  const { customModels: currentCustomModels, gatedModels: currentGatedModels } = await ExtraModelsForProvider(
    availableProviderData.provider as ModelProvider,
    decrypt(availableProviderData.encryptedAPIKey)
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
        availableProviderData.encryptedAPIKey,
        { ...previousMetadata, customModels: filteredCustomModels, gatedModels: currentGatedModels },
        availableProviderData.createdAt,
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
