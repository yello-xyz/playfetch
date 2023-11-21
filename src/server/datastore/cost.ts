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

export async function migrateAnalytics(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allCost] = await datastore.runQuery(datastore.createQuery(Entity.COST))
  for (const costData of allCost) {
    await getDatastore().save(
      toCostData(
        costData.scopeID,
        costData.model,
        costData.range,
        costData.createdAt,
        costData.cost,
        getID(costData)
      )
    )
  }
}

const daysAgo = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  result.setUTCHours(0, 0, 0, 0)
  return result
}

type ModelCost = { model: string; cost: number[] }

export async function getCostAnalyticsForScope(userID: number, scopeID: number): Promise<ModelCost[]> {
  await ensureScopeAccess(userID, scopeID)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const dayInMonth = today.getUTCDate()
  const costData = await getFilteredEntities(
    Entity.COST,
    and([buildFilter('scopeID', scopeID), afterDateFilter(daysAgo(today, dayInMonth))])
  )

  const costs: ModelCost[] = []
  const daysOfMonth = Array.from({ length: dayInMonth }, (_, index) => daysAgo(today, index)).reverse()
  for (const model of new Set(costData.map(cost => cost.model as string))) {
    const costMap: { [timestamp: number]: number } = Object.fromEntries(
      costData.filter(cost => cost.model === model).map(cost => [cost.createdAt.getTime(), cost.cost])
    )
    costs.push({ model, cost: daysOfMonth.map(day => costMap[day.getTime()] ?? 0) })
  }

  const totalCost = (cost: ModelCost) => cost.cost.reduce((sum, cost) => sum + cost, 0)

  return costs.sort((a, b) => totalCost(b) - totalCost(a))
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

const toCostData = (
  scopeID: number,
  model: string,
  range: 'day',
  createdAt: Date,
  cost: number,
  costID?: number
) => ({
  key: buildKey(Entity.COST, costID),
  data: { scopeID, model, range, createdAt, cost },
  excludeFromIndexes: [],
})
