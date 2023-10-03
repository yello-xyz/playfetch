import { incrementProviderCostForUser } from './datastore/providers'
import { CreateEmbedding } from './providers/integration'
import runVectorQuery from './providers/pinecone'

type QueryResponse = (
  | { result: string[]; output: string; error: undefined; failed: false }
  | { result: undefined; output: undefined; error: string; failed: true }
) & { cost: number; attempts: number }

export const runQuery = async (userID: number, indexName: string, query: string): Promise<QueryResponse> => {
  try {
    const { embedding, cost } = await CreateEmbedding(userID, query)

    incrementProviderCostForUser(userID, 'openai', cost)

    const result = await runVectorQuery(
      process.env.PINECONE_KEY ?? '',
      process.env.PINECONE_ENV ?? '',
      indexName,
      embedding
    )

    return { result, output: result.join('\n'), error: undefined, failed: false, cost, attempts: 1 }
  } catch (error: any) {
    return { result: undefined, output: undefined, error: error.message, failed: true, cost: 0, attempts: 1 }
  }
}
