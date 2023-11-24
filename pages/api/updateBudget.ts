import { updateBudgetForScope } from '@/src/server/datastore/budget'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateBudget(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateBudgetForScope(user.id, req.body.scopeID, req.body.limit ?? null, req.body.threshold ?? null)
  res.json({})
}

export default withLoggedInUserRoute(updateBudget)
