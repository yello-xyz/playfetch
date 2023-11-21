import { EmbeddingModel, QueryProvider } from '@/types'
import { getProviderCredentials, incrementProviderCost } from '../datastore/providers'
import { CredentialsForProvider, CreateEmbedding } from '../providers/integration'
import runVectorQuery from '../providers/pinecone'
import { ProviderForModel } from '../../common/providerMetadata'
import { updateScopedModelCost } from '../datastore/cost'

type QueryResponse = (
  | { result: string[]; output: string; error: undefined; failed: false }
  | { result: undefined; output: undefined; error: string; failed: true }
) & { cost: number; attempts: number }

export const runQuery = async (
  userID: number,
  projectID: number,
  provider: QueryProvider,
  model: EmbeddingModel,
  indexName: string,
  query: string,
  topK: number
): Promise<QueryResponse> => {
  try {
    const scopeIDs = [projectID, userID]
    const { apiKey, environment } = await getProviderCredentials(scopeIDs, provider)
    if (!apiKey || !environment) {
      throw new Error('Missing vector store credentials')
    }

    const embeddingProvider = ProviderForModel(model)
    const { scopeID, providerID, apiKey: embeddingAPIKey } = await CredentialsForProvider(scopeIDs, embeddingProvider)
    if (!embeddingAPIKey) {
      throw new Error('Missing API key')
    }

    const { embedding, cost } = await CreateEmbedding(embeddingProvider, embeddingAPIKey, userID, query)
    if (providerID && scopeID && cost > 0) {
      incrementProviderCost(providerID, cost)
      updateScopedModelCost(scopeID, model, cost)
    }

    const result = await runVectorQuery(apiKey, environment, indexName, embedding, topK)

    return { result, output: result.join('\n'), error: undefined, failed: false, cost, attempts: 1 }
  } catch (error: any) {
    return { result: undefined, output: undefined, error: error.message, failed: true, cost: 0, attempts: 1 }
  }
}
