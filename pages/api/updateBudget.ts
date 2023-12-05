import logUserRequest, { BudgetEvent } from '@/src/server/analytics'
import { updateBudgetForScope } from '@/src/server/datastore/budget'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateBudget(req: NextApiRequest, res: NextApiResponse, user: User) {
  const scopeID = req.body.scopeID
  const limit = req.body.limit
  const threshold = req.body.threshold
  logUserRequest(req, res, user.id, BudgetEvent(scopeID === user.id ? 'user' : 'project', scopeID, limit ?? 0))
  await updateBudgetForScope(user.id, scopeID, limit ?? null, threshold ?? null)
  res.json({})
}

export default withLoggedInUserRoute(updateBudget)
