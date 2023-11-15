import { Usage } from '@/types'
import {
  Entity,
  runTransactionWithExponentialBackoff,
  buildKey,
  getDatastore,
  getID,
  getKeyedEntity,
} from './datastore'

export async function migrateUsage() {
  const datastore = getDatastore()
  const [allUsage] = await datastore.runQuery(datastore.createQuery(Entity.USAGE))
  for (const usageData of allUsage) {
    await getDatastore().save(
      toUsageData(
        getID(usageData),
        usageData.projectID,
        usageData.parentID,
        usageData.requests,
        usageData.cost,
        usageData.duration,
        usageData.cacheHits,
        usageData.continuations,
        usageData.attempts,
        usageData.failures,
        usageData.createdAt,
        usageData.lastRunAt
      )
    )
  }
}

export async function saveUsage(endpointID: number, projectID: number, parentID: number) {
  await getDatastore().save(toUsageData(endpointID, projectID, parentID, 0, 0, 0, 0, 0, 0, 0, new Date()))
}

export async function updateUsage(
  endpointID: number,
  incrementalCost: number,
  incrementalDuration: number,
  cacheHit: boolean,
  isContinuation: boolean,
  attempts: number,
  failed: boolean
) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const usageData = await getKeyedEntity(Entity.USAGE, endpointID, transaction)
    transaction.save(
      toUsageData(
        endpointID,
        usageData.projectID,
        usageData.parentID,
        usageData.requests + 1,
        usageData.cost + incrementalCost,
        usageData.duration + incrementalDuration,
        usageData.cacheHits + (cacheHit ? 1 : 0),
        usageData.continuations + (isContinuation ? 1 : 0),
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
  projectID: number,
  parentID: number,
  requests: number,
  cost: number,
  duration: number,
  cacheHits: number,
  continuations: number,
  attempts: number,
  failures: number,
  createdAt: Date,
  lastRunAt?: Date
) => ({
  key: buildKey(Entity.USAGE, endpointID),
  data: {
    projectID,
    parentID,
    requests,
    cost,
    duration,
    cacheHits,
    continuations,
    attempts,
    failures,
    createdAt,
    lastRunAt,
  },
  excludeFromIndexes: [],
})

export const toUsage = (data: any): Usage => ({
  requests: data.requests,
  cost: data.cost,
  duration: data.duration,
  cacheHits: data.cacheHits,
  attempts: data.attempts,
  failures: data.failures,
})
