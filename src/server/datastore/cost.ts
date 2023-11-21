import { and } from '@google-cloud/datastore'
import {
  Entity,
  runTransactionWithExponentialBackoff,
  buildKey,
  getDatastore,
  getID,
  buildFilter,
  getFilteredEntity,
  getFilteredEntities,
  afterDateFilter,
} from './datastore'
import { ensureScopeAccess } from './providers'
import { ModelCosts } from '@/types'
import { DaysAgo } from '@/src/common/formatting'

export async function migrateAnalytics(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allCost] = await datastore.runQuery(datastore.createQuery(Entity.COST))
  for (const costData of allCost) {
    await getDatastore().save(
      toCostData(costData.scopeID, costData.model, costData.range, costData.createdAt, costData.cost, getID(costData))
    )
  }
}

export async function getModelCostsForScope(userID: number, scopeID: number): Promise<ModelCosts[]> {
  await ensureScopeAccess(userID, scopeID)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const dayInMonth = today.getUTCDate()
  const costsData = await getFilteredEntities(
    Entity.COST,
    and([buildFilter('scopeID', scopeID), afterDateFilter(DaysAgo(today, dayInMonth))])
  )

  const costMap: { [timestamp: number]: { [model: string]: number } } = {}
  for (const costData of costsData) {
    const timestamp = costData.createdAt.getTime()
    costMap[timestamp] = { ...(costMap[timestamp] ?? {}), [costData.model]: costData.cost }
  }

  const daysOfMonth = Array.from({ length: dayInMonth }, (_, index) => DaysAgo(today, index)).reverse()

  return daysOfMonth.map(day => costMap[day.getTime()] ?? {})
}

export async function updateScopedModelCost(
  scopeID: number,
  model: string,
  incrementalCost: number,
  timestamp = new Date(),
  range: 'day' = 'day'
) {
  const startOfDay = new Date(timestamp)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const filter = and([
    buildFilter('scopeID', scopeID),
    buildFilter('model', model),
    buildFilter('createdAt', startOfDay),
  ])
  await runTransactionWithExponentialBackoff(async transaction => {
    const previousData = await getFilteredEntity(Entity.COST, filter, transaction)
    transaction.save(
      toCostData(
        scopeID,
        model,
        range,
        startOfDay,
        (previousData?.cost ?? 0) + incrementalCost,
        previousData ? getID(previousData) : undefined
      )
    )
  })
}

const toCostData = (scopeID: number, model: string, range: 'day', createdAt: Date, cost: number, costID?: number) => ({
  key: buildKey(Entity.COST, costID),
  data: { scopeID, model, range, createdAt, cost },
  excludeFromIndexes: [],
})
