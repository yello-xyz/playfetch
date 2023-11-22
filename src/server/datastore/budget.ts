import { Entity, runTransactionWithExponentialBackoff, buildKey, getDatastore, getKeyedEntity } from './datastore'
import { ensureScopeAccess } from './providers'

export async function migrateBudgets(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allBudgets] = await datastore.runQuery(datastore.createQuery(Entity.BUDGET))
  for (const budgetData of allBudgets) {
    await getDatastore().save(
      toBudgetData(
        budgetData.scopeID,
        budgetData.userID,
        budgetData.createdAt,
        budgetData.limit,
        budgetData.resetsAt,
        budgetData.threshold,
        budgetData.cost
      )
    )
  }
}

const startOfNextMonth = () => {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return new Date(today.getFullYear(), today.getMonth() + 1, 1)
}

const getBudgetData = (scopeID: number) => getKeyedEntity(Entity.BUDGET, scopeID)

const toBudget = (data: any | undefined): { limit: number | null; cost: number } => ({
  limit: data?.limit ?? null,
  cost: data?.cost ?? 0,
})

export const getTrustedBudgetForScope = (scopeID: number) => getBudgetData(scopeID).then(toBudget)

export async function updateBudgetForScope(
  userID: number,
  scopeID: number,
  limit: number | null,
  threshold: number | null
) {
  await ensureScopeAccess(userID, scopeID)
  const budgetData = await getBudgetData(scopeID)
  const resetsAt = budgetData?.resetsAt ?? startOfNextMonth()
  const cost = budgetData?.cost ?? 0
  await getDatastore().save(toBudgetData(scopeID, userID, new Date(), limit, resetsAt, threshold, cost))
}

export async function checkBudgetForScope(scopeID: number): Promise<boolean> {
  const budgetData = await getBudgetData(scopeID)
  if (!budgetData) {
    return true
  }
  if (new Date() > budgetData.resetsAt) {
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

export async function incrementCostForScope(scopeID: number, cost: number) {
  await runTransactionWithExponentialBackoff(async transaction => {
    const budgetData = await getKeyedEntity(Entity.BUDGET, scopeID, transaction)
    transaction.save(
      toBudgetData(
        scopeID,
        budgetData?.userID ?? scopeID,
        budgetData?.createdAt ?? new Date(),
        budgetData?.limit ?? null,
        budgetData?.resetsAt ?? startOfNextMonth(),
        budgetData?.threshold ?? null,
        (budgetData?.cost ?? 0) + cost
      )
    )
  })
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
