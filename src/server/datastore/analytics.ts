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
import { getLogEntriesForProject } from './logs'
import { DaysAgo } from '@/src/common/formatting'

export async function migrateAnalytics(postMerge: boolean) {
  if (!postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allAnalytics] = await datastore.runQuery(datastore.createQuery(Entity.ANALYTICS))
  const usedProjectIDs = new Set(allAnalytics.map(analyticsData => analyticsData.projectID))
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  const allProjectIDs = new Set(allProjects.map(project => getID(project)))
  console.log(
    `Found ${allAnalytics.length} analytics entries (for ${usedProjectIDs.size} projects out of ${allProjectIDs.size})`
  )
  for (const analyticsData of allAnalytics) {
    if (!allProjectIDs.has(analyticsData.projectID)) {
      console.log(`Deleting analytics entry ${getID(analyticsData)} for missing project ${analyticsData.projectID}`)
      await datastore.delete(buildKey(Entity.ANALYTICS, getID(analyticsData)))
    }
    // await getDatastore().save(
    //   toAnalyticsData(
    //     analyticsData.projectID,
    //     analyticsData.range,
    //     analyticsData.createdAt,
    //     analyticsData.requests,
    //     analyticsData.cost,
    //     analyticsData.duration,
    //     analyticsData.cacheHits,
    //     analyticsData.continuations,
    //     analyticsData.attempts,
    //     analyticsData.failures,
    //     getID(analyticsData)
    //   )
    // )
  }
}

export async function getAnalyticsForProject(
  userID: number,
  projectID: number,
  trusted = false,
  dayRange = 30
): Promise<Analytics> {
  if (!trusted) {
    await ensureProjectAccess(userID, projectID)
  }

  const recentLogEntries = await getLogEntriesForProject(userID, projectID, true)
  const analyticsData = await getOrderedEntities(Entity.ANALYTICS, 'projectID', projectID, ['createdAt'], 2 * dayRange)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const recentDays = Array.from({ length: dayRange }, (_, index) => DaysAgo(today, index)).reverse()
  const usageMap: { [timestamp: number]: Usage } = Object.fromEntries(
    analyticsData
      .filter(usage => usage.createdAt >= recentDays[0])
      .map(usage => [usage.createdAt.getTime(), toUsage(usage)])
  )
  const emptyUsage: Usage = {
    requests: 0,
    cost: 0,
    duration: 0,
    cacheHits: 0,
    continuations: 0,
    attempts: 0,
    failures: 0,
  }
  const recentUsage = recentDays.map(day => usageMap[day.getTime()] ?? emptyUsage)

  const cutoff = DaysAgo(today, 2 * dayRange - 1)
  const previous30Days = analyticsData.filter(usage => usage.createdAt >= cutoff && usage.createdAt < recentDays[0])
  const aggregatePreviousUsage = previous30Days.reduce(
    (acc, usage) => ({
      requests: acc.requests + usage.requests,
      cost: acc.cost + usage.cost,
      duration: acc.duration + usage.duration,
      cacheHits: acc.cacheHits + usage.cacheHits,
      continuations: acc.continuations + usage.continuations,
      attempts: acc.attempts + usage.attempts,
      failures: acc.failures + usage.failures,
    }),
    emptyUsage
  )

  return { recentLogEntries, recentUsage, aggregatePreviousUsage }
}

export async function updateAnalytics(
  projectID: number,
  incrementalCost: number,
  incrementalDuration: number,
  cacheHit: boolean,
  isContinuation: boolean,
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
        (previousData?.continuations ?? 0) + (isContinuation ? 1 : 0),
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
  continuations: number,
  attempts: number,
  failures: number,
  analyticsID?: number
) => ({
  key: buildKey(Entity.ANALYTICS, analyticsID),
  data: { projectID, range, createdAt, requests, cost, duration, cacheHits, continuations, attempts, failures },
  excludeFromIndexes: [],
})
