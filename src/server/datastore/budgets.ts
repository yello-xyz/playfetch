import { sendBudgetNotificationEmails } from '../email'
import {
  Entity,
  runTransactionWithExponentialBackoff,
  buildKey,
  getDatastore,
  getKeyedEntity,
  getID,
} from './datastore'
import { ensureScopeOwnership } from './providers'

export async function migrateBudgets(postMerge: boolean) {
  const datastore = getDatastore()
  const [allBudgets] = await datastore.runQuery(datastore.createQuery(Entity.BUDGET))
  const usedScopeIDs = new Set(allBudgets.map(budgetData => getID(budgetData)))
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  const [allUsers] = await datastore.runQuery(datastore.createQuery(Entity.USER))
  const allScopeIDs = new Set([...allProjects.map(project => getID(project)), ...allUsers.map(user => getID(user))])
  console.log(`Found ${allBudgets.length} budgets (for ${usedScopeIDs.size} scopes out of ${allScopeIDs.size})`)
  for (const budgetData of allBudgets) {
    if (!allScopeIDs.has(getID(budgetData))) {
      console.log(`Deleting budget ${getID(budgetData)} for missing scope ${getID(budgetData)}`)
      if (postMerge) {
        await datastore.delete(buildKey(Entity.BUDGET, getID(budgetData)))
      }
    }
    // await getDatastore().save(
    //   toBudgetData(
    //     getID(budgetData),
    //     budgetData.userID,
    //     budgetData.createdAt,
    //     budgetData.limit,
    //     budgetData.resetsAt,
    //     budgetData.threshold,
    //     budgetData.cost
    //   )
    // )
  }
}

const startOfNextMonth = () => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return new Date(today.getFullYear(), today.getMonth() + 1, 1)
}

const getBudgetData = (scopeID: number) => getKeyedEntity(Entity.BUDGET, scopeID)

const budgetDataNeedsCostReset = (data: any | undefined) => data?.resetsAt && new Date() > data.resetsAt

const toBudget = (data: any | undefined): { limit: number | null; threshold: number | null; cost: number } => ({
  limit: data?.limit ?? null,
  threshold: data?.threshold ?? null,
  cost: budgetDataNeedsCostReset(data) ? 0 : data?.cost ?? 0,
})

export const getTrustedBudgetForScope = (scopeID: number) => getBudgetData(scopeID).then(toBudget)

export async function updateBudgetForScope(
  userID: number,
  scopeID: number,
  limit: number | null,
  threshold: number | null
) {
  await ensureScopeOwnership(userID, scopeID)
  const budgetData = await getBudgetData(scopeID)
  const resetsAt = budgetData?.resetsAt ?? startOfNextMonth()
  const cost = budgetData?.cost ?? 0
  if (threshold !== null && (limit === null || threshold >= limit)) {
    threshold = null
  }
  await getDatastore().save(toBudgetData(scopeID, userID, new Date(), limit, resetsAt, threshold, cost))
}

export async function checkBudgetForScope(scopeID: number): Promise<boolean> {
  const budgetData = await getBudgetData(scopeID)
  if (!budgetData) {
    return true
  }
  if (budgetDataNeedsCostReset(budgetData)) {
    await getDatastore().save(
      toBudgetData(
        scopeID,
        budgetData.userID,
        budgetData.createdAt,
        budgetData.limit,
        startOfNextMonth(),
        budgetData.threshold,
        0
      )
    )
    return budgetData.limit === null || budgetData.limit > 0
  }
  return budgetData.limit === null || budgetData.cost < budgetData.limit
}

export async function incrementCostForScope(scopeID: number, incrementalCost: number) {
  const [cost, threshold, limit] = await runTransactionWithExponentialBackoff(async transaction => {
    const budgetData = await getKeyedEntity(Entity.BUDGET, scopeID, transaction)
    const limit = budgetData?.limit ?? null
    const threshold = budgetData?.threshold ?? null
    const cost = (budgetData?.cost ?? 0) + incrementalCost
    transaction.save(
      toBudgetData(
        scopeID,
        budgetData?.userID ?? scopeID,
        budgetData?.createdAt ?? new Date(),
        limit,
        budgetData?.resetsAt ?? startOfNextMonth(),
        threshold,
        cost
      )
    )
    return [cost, threshold, limit] as [number, number | null, number | null]
  })
  const reachedLimit = (limit: number | null) => limit !== null && cost - incrementalCost < limit && cost >= limit
  if (reachedLimit(limit)) {
    sendBudgetNotificationEmails(scopeID, limit!)
  } else if (reachedLimit(threshold)) {
    sendBudgetNotificationEmails(scopeID, threshold!, limit)
  }
}

const toBudgetData = (
  scopeID: number,
  userID: number,
  createdAt: Date,
  limit: number | null,
  resetsAt: Date,
  threshold: number | null,
  cost: number
) => ({
  key: buildKey(Entity.BUDGET, scopeID),
  data: { limit, resetsAt, threshold, cost, userID, createdAt },
  excludeFromIndexes: [],
})
