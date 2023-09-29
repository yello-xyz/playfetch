import { and } from '@google-cloud/datastore'
import {
  Entity,
  runTransactionWithExponentialBackoff,
  buildKey,
  getDatastore,
  getID,
  buildFilter,
  getFilteredEntity,
} from './datastore'
import { Usage } from '@/types'

export async function migrateAnalytics(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allAnalytics] = await datastore.runQuery(datastore.createQuery(Entity.ANALYTICS))
  for (const analyticsData of allAnalytics) {
    await getDatastore().save(
      toAnalyticsData(
        analyticsData.projectID,
        analyticsData.range,
        analyticsData.createdAt,
        analyticsData.requests,
        analyticsData.cost,
        analyticsData.duration,
        analyticsData.cacheHits,
        analyticsData.attempts,
        analyticsData.failures,
        getID(analyticsData),
      )
    )
  }
}

export async function updateAnalytics(
  projectID: number,
  incrementalCost: number,
  incrementalDuration: number,
  cacheHit: boolean,
  attempts: number,
  failed: boolean
) {
  const timestamp = new Date()
  timestamp.setUTCHours(0, 0, 0, 0)
  const filter = and([buildFilter('projectID', projectID), buildFilter('range', 'day'), buildFilter('createdAt', timestamp)])
  await runTransactionWithExponentialBackoff(async transaction => {
    const previousData = await getFilteredEntity(Entity.ANALYTICS, filter, transaction)
    transaction.save(
      toAnalyticsData(
        projectID,
        'day',
        timestamp,
        (previousData?.requests ?? 0) + 1,
        (previousData?.cost ?? 0) + incrementalCost,
        (previousData?.duration ?? 0) + incrementalDuration,
        (previousData?.cacheHits ?? 0) + (cacheHit ? 1 : 0),
        (previousData?.attempts ?? 0) + attempts,
        (previousData?.failures ?? 0) + (failed ? 1 : 0),
        previousData ? getID(previousData) : undefined
      )
    )
  })
}

const toAnalyticsData = (
  projectID: number,
  range: 'day',
  createdAt: Date,
  requests: number,
  cost: number,
  duration: number,
  cacheHits: number,
  attempts: number,
  failures: number,
  analyticsID?: number
) => ({
  key: buildKey(Entity.ANALYTICS, analyticsID),
  data: { projectID, range, createdAt, requests, cost, duration, cacheHits, attempts, failures },
  excludeFromIndexes: [],
})

export const toAnalytics = (data: any): Usage => ({
  requests: data.requests,
  cost: data.cost,
  duration: data.duration,
  cacheHits: data.cacheHits,
  attempts: data.attempts,
  failures: data.failures,
})
