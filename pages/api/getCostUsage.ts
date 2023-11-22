import { getCostUsageForScope } from '@/src/server/datastore/cost'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User, CostUsage } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getCostUsage(req: NextApiRequest, res: NextApiResponse<CostUsage>, user: User) {
  const analytics = await getCostUsageForScope(user.id, req.body.scopeID)
  res.json(analytics)
}

export default withLoggedInUserRoute(getCostUsage)
