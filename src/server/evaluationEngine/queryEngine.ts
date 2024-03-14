import { EmbeddingModel, QueryProvider } from '@/types'
import { getProviderCredentials } from '@/src/server/datastore/providers'
import {
  CredentialsForProvider,
  CreateEmbedding,
  IncrementProviderCost,
  CheckBudgetForProvider,
} from '@/src/server/providers/integration'
import runVectorQuery from '@/src/server/providers/pinecone'
import { ProviderForModel } from '@/src/common/providerMetadata'
import { EmptyRunResponse, ErrorRunResponse, RunResponse } from './runResponse'

export const runQuery = async (
  userID: number,
  workspaceID: number,
  projectID: number,
  provider: QueryProvider,
  model: EmbeddingModel,
  indexName: string,
  query: string,
  topK: number
): Promise<RunResponse> => {
  try {
    const scopeIDs = [projectID, workspaceID, userID]
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

    const { embedding, cost, inputTokens } = await CreateEmbedding(
      embeddingProvider,
      embeddingAPIKey,
      userID,
      model,
      query
    )
    IncrementProviderCost(scopeID, projectID, userID, providerID, model, cost)

    const result = await runVectorQuery(apiKey, environment, indexName, embedding, topK)

    return { ...EmptyRunResponse(), result, output: result.join('\n'), cost, inputTokens }
  } catch (error: any) {
    return ErrorRunResponse(error.message)
  }
}
