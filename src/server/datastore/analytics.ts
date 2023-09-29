import { and } from '@google-cloud/datastore'
import {
  Entity,
  runTransactionWithExponentialBackoff,
  buildKey,
  getDatastore,
  getID,
  buildFilter,
  getFilteredEntity,
  getOrderedEntities,
} from './datastore'
import { Analytics, Usage } from '@/types'
import { ensureProjectAccess } from './projects'
import { toUsage } from './usage'

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
        getID(analyticsData)
      )
    )
  }
}

const daysAgo = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

export async function getAnalyticsForProject(userID: number, projectID: number, trusted = false): Promise<Analytics> {
  if (!trusted) {
    await ensureProjectAccess(userID, projectID)
  }
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const days = Array.from({ length: 30 }, (_, index) => daysAgo(today, index)).reverse()
  const analyticsData = await getOrderedEntities(Entity.ANALYTICS, 'projectID', projectID, ['createdAt'], 30)
  const usageMap: { [timestamp: number]: Usage } = Object.fromEntries(
    analyticsData
      .filter(datapoint => datapoint.createdAt >= days[0])
      .map(datapoint => [datapoint.createdAt.getTime(), toUsage(datapoint)])
  )
  const usages = days.map(day => usageMap[day.getTime()] as Usage | undefined)
  const extract = (key: keyof Usage) => usages.map(usage => usage?.[key] ?? 0)
  return {
    requests: extract('requests'),
    cost: extract('cost'),
    duration: extract('duration'),
    cacheHits: extract('cacheHits'),
    attempts: extract('attempts'),
    failures: extract('failures'),
  }
}

export async function updateAnalytics(
  projectID: number,
  incrementalCost: number,
  incrementalDuration: number,
  cacheHit: boolean,
  attempts: number,
  failed: boolean,
  timestamp = new Date(),
  range: 'day' = 'day'
) {
  const startOfDay = new Date(timestamp)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const filter = and([buildFilter('projectID', projectID), buildFilter('createdAt', startOfDay)])
  await runTransactionWithExponentialBackoff(async transaction => {
    const previousData = await getFilteredEntity(Entity.ANALYTICS, filter, transaction)
    transaction.save(
      toAnalyticsData(
        projectID,
        range,
        startOfDay,
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
