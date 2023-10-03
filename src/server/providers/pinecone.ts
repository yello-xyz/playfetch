import { Pinecone } from '@pinecone-database/pinecone'

export default async function runVectorQuery(
  apiKey: string,
  environment: string,
  indexName: string,
  vector: number[],
  topK = 1
) {
  const pinecone = new Pinecone({ apiKey, environment })
  const index = pinecone.index(indexName)
  const queryResponse = await index.query({
    topK,
    vector,
    includeMetadata: true,
  })
  return (queryResponse.matches ?? []).map(match => match.metadata?.['text'] as string ?? '')
}
