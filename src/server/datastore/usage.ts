import { Usage } from '@/types'
import { Entity, runTransactionWithExponentialBackoff, buildKey, getDatastore, getID } from './datastore'

export async function migrateUsage() {
  const datastore = getDatastore()
  const [allUsage] = await datastore.runQuery(datastore.createQuery(Entity.USAGE))
  for (const usageData of allUsage) {
    const parentID = usageData.promptID
    await getDatastore().save(
      toUsageData(
        getID(usageData),
        parentID,
        usageData.requests,
        usageData.cost,
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
  await getDatastore().save(toUsageData(endpointID, parentID, 0, 0, 0, 0, 0, new Date()))
}

export async function updateUsage(
  endpointID: number,
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
        usageData.parentID,
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
  parentID: number,
  requests: number,
  cost: number,
  cacheHits: number,
  attempts: number,
  failures: number,
  createdAt: Date,
  lastRunAt?: Date
) => ({
  key: buildKey(Entity.USAGE, endpointID),
  data: { parentID, requests, cost, cacheHits, attempts, failures, createdAt, lastRunAt },
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
