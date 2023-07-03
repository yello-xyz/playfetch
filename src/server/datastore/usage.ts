import { Usage } from '@/types'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity } from './datastore'

export async function updateUsage(
  endpointID: number,
  promptID: number,
  incrementalCost: number,
  cacheHit: boolean,
  attempts: number,
  failed: boolean
) {
  const usageData = await getKeyedEntity(Entity.USAGE, endpointID)
  await getDatastore().save(
    toUsageData(
      endpointID,
      promptID,
      (usageData.requests ?? 0)  + 1,
      (usageData.cost ?? 0) + incrementalCost,
      (usageData.cacheHits ?? 0) + (cacheHit ? 1 : 0),
      (usageData.attempts ?? 0) + attempts,
      (usageData.failures ?? 0) + (failed ? 1 : 0),
      usageData.createdAt ?? new Date(),
      new Date()
    )
  )
}

const toUsageData = (
  endpointID: number,
  promptID: number,
  requests: number,
  cost: number,
  cacheHits: number,
  attempts: number,
  failures: number,
  createdAt: Date,
  lastRunAt: Date,
) => ({
  key: buildKey(Entity.USAGE, endpointID),
  data: { promptID, requests, cost, cacheHits, attempts, failures, createdAt, lastRunAt },
  excludeFromIndexes: [],
})

export const toUsage = (data: any): Usage => ({
  endpointID: getID(data),
  requests: data.requests,
  cost: data.cost,
  cacheHits: data.cacheHits,
  attempts: data.attempts,
  failures: data.failures,
})
