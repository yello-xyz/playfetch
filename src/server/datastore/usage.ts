import { Usage } from '@/types'
import { Entity, runTransactionWithExponentialBackoff, buildKey, getDatastore, getID } from './datastore'

export async function migrateUsage() {
  const datastore = getDatastore()
  const [allUsage] = await datastore.runQuery(datastore.createQuery(Entity.USAGE))
  for (const usageData of allUsage) {
    await getDatastore().save(
      toUsageData(
        getID(usageData),
        usageData.parentID,
        usageData.requests,
        usageData.cost,
        0,
        usageData.cacheHits,
        usageData.attempts,
        usageData.failures,
        usageData.createdAt,
        usageData.lastRunAt
      )
    )
  }
}

export async function saveUsage(endpointID: number, parentID: number) {
  await getDatastore().save(toUsageData(endpointID, parentID, 0, 0, 0, 0, 0, 0, new Date()))
}

export async function updateUsage(
  endpointID: number,
  incrementalCost: number,
  incrementalDuration: number,
  cacheHit: boolean,
  attempts: number,
  failed: boolean
) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const [usageData] = await transaction.get(buildKey(Entity.USAGE, endpointID))
    transaction.save(
      toUsageData(
        endpointID,
        usageData.parentID,
        usageData.requests + 1,
        usageData.cost + incrementalCost,
        usageData.duration + incrementalDuration,
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
  parentID: number,
  requests: number,
  cost: number,
  duration: number,
  cacheHits: number,
  attempts: number,
  failures: number,
  createdAt: Date,
  lastRunAt?: Date
) => ({
  key: buildKey(Entity.USAGE, endpointID),
  data: { parentID, requests, cost, duration, cacheHits, attempts, failures, createdAt, lastRunAt },
  excludeFromIndexes: [],
})

export const toUsage = (data: any): Usage => ({
  endpointID: getID(data),
  requests: data.requests,
  cost: data.cost,
  duration: data.duration,
  cacheHits: data.cacheHits,
  attempts: data.attempts,
  failures: data.failures,
})
