import { getProviderCredentials, incrementProviderCostForUser } from './datastore/providers'
import { APIKeyForProvider, CreateEmbedding } from './providers/integration'
import runVectorQuery from './providers/pinecone'

type QueryResponse = (
  | { result: string[]; output: string; error: undefined; failed: false }
  | { result: undefined; output: undefined; error: string; failed: true }
) & { cost: number; attempts: number }

export const runQuery = async (userID: number, indexName: string, query: string): Promise<QueryResponse> => {
  try {
    const embeddingProvider = 'openai'
    const embeddingApiKey = await APIKeyForProvider(userID, embeddingProvider)
    if (!embeddingApiKey) {
      throw new Error('Missing API key')
    }

    const queryProvider = 'pinecone'
    const [queryAPIKey, queryEnvironment] = await getProviderCredentials(userID, queryProvider)
    if (!queryAPIKey || !queryEnvironment) {
      throw new Error('Missing vector store credentials')
    }

    const { embedding, cost } = await CreateEmbedding(embeddingProvider, embeddingApiKey, userID, query)
    incrementProviderCostForUser(userID, embeddingProvider, cost)

    const result = await runVectorQuery(queryAPIKey, queryEnvironment, indexName, embedding)

    return { result, output: result.join('\n'), error: undefined, failed: false, cost, attempts: 1 }
  } catch (error: any) {
    return { result: undefined, output: undefined, error: error.message, failed: true, cost: 0, attempts: 1 }
  }
}
