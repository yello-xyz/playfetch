import { EmbeddingModel, QueryProvider } from '@/types'
import { getProviderCredentials, incrementProviderCostForScope } from '../datastore/providers'
import { APIKeyForProvider, CreateEmbedding } from '../providers/integration'
import runVectorQuery from '../providers/pinecone'
import { ProviderForModel } from '../../common/providerMetadata'

type QueryResponse = (
  | { result: string[]; output: string; error: undefined; failed: false }
  | { result: undefined; output: undefined; error: string; failed: true }
) & { cost: number; attempts: number }

export const runQuery = async (
  userID: number,
  provider: QueryProvider,
  model: EmbeddingModel,
  indexName: string,
  query: string,
  topK: number
): Promise<QueryResponse> => {
  try {
    const [queryAPIKey, queryEnvironment] = await getProviderCredentials(userID, provider)
    if (!queryAPIKey || !queryEnvironment) {
      throw new Error('Missing vector store credentials')
    }

    const embeddingProvider = ProviderForModel(model)
    const embeddingApiKey = await APIKeyForProvider(userID, embeddingProvider)
    if (!embeddingApiKey) {
      throw new Error('Missing API key')
    }

    const { embedding, cost } = await CreateEmbedding(embeddingProvider, embeddingApiKey, userID, query)
    incrementProviderCostForScope(userID, embeddingProvider, cost)

    const result = await runVectorQuery(queryAPIKey, queryEnvironment, indexName, embedding, topK)

    return { result, output: result.join('\n'), error: undefined, failed: false, cost, attempts: 1 }
  } catch (error: any) {
    return { result: undefined, output: undefined, error: error.message, failed: true, cost: 0, attempts: 1 }
  }
}
