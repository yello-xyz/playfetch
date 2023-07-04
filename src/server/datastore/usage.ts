import { Usage } from '@/types'
import { Entity, runTransactionWithExponentialBackoff, buildKey, getDatastore, getID } from './datastore'

export async function saveOrResetUsage(endpointID: number, promptID: number) {
  await getDatastore().save(toUsageData(endpointID, promptID, 0, 0, 0, 0, 0, new Date()))
}

export async function updateUsage(
  endpointID: number,
  promptID: number,
  incrementalCost: number,
  cacheHit: boolean,
  attempts: number,
  failed: boolean
) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const [usageData] = await transaction.get(buildKey(Entity.USAGE, endpointID))
    transaction.save(
      toUsageData(
        endpointID,
        promptID,
        usageData.requests + 1,
        usageData.cost + incrementalCost,
        usageData.cacheHits + (cacheHit ? 1 : 0),
        usageData.attempts + attempts,
        usageData.failures + (failed ? 1 : 0),
        usageData.createdAt,
        new Date()
      )
    )
  })
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
  lastRunAt?: Date
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
