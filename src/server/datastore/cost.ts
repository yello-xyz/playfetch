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
import { ensureScopeOwnership } from './providers'
import { CostUsage } from '@/types'
import { DaysAgo } from '@/src/common/formatting'
import { getTrustedBudgetForScope } from './budget'

export async function migrateCosts(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allCosts] = await datastore.runQuery(datastore.createQuery(Entity.COST))
  for (const costData of allCosts) {
    await getDatastore().save(
      toCostData(costData.scopeID, costData.model, costData.range, costData.createdAt, costData.cost, getID(costData))
    )
  }
}

export async function getCostUsageForScope(userID: number, scopeID: number): Promise<CostUsage> {
  await ensureScopeOwnership(userID, scopeID)

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

  const budget = await getTrustedBudgetForScope(scopeID)

  return {
    limit: budget?.limit,
    threshold: budget?.threshold,
    cost: budget.cost,
    modelCosts: daysOfMonth.map(day => costMap[day.getTime()] ?? {}),
  }
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
