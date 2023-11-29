import { EmbeddingModel, QueryProvider } from '@/types'
import { getProviderCredentials } from '../datastore/providers'
import {
  CredentialsForProvider,
  CreateEmbedding,
  IncrementProviderCost,
  CheckBudgetForProvider,
} from '../providers/integration'
import runVectorQuery from '../providers/pinecone'
import { ProviderForModel } from '../../common/providerMetadata'
import { ErrorRunResponse, RunResponse } from './chainEngine'

export const runQuery = async (
  userID: number,
  projectID: number,
  provider: QueryProvider,
  model: EmbeddingModel,
  indexName: string,
  query: string,
  topK: number
): Promise<RunResponse> => {
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
    if (!(await CheckBudgetForProvider(scopeID, embeddingProvider))) {
      throw new Error('Monthly usage limit exceeded')
    }

    const { embedding, cost } = await CreateEmbedding(embeddingProvider, embeddingAPIKey, userID, query)
    IncrementProviderCost(scopeID, providerID, model, cost)

    const result = await runVectorQuery(apiKey, environment, indexName, embedding, topK)

    return { result, output: result.join('\n'), error: undefined, failed: false, cost, attempts: 1 }
  } catch (error: any) {
    return ErrorRunResponse(error.message)
  }
}
