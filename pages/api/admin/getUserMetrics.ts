import { getMetricsForUser } from '@/src/server/datastore/users'
import { withAdminUserRoute } from '@/src/server/session'
import { UserMetrics } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getUserMetrics(req: NextApiRequest, res: NextApiResponse<UserMetrics>) {
  const userMetrics = await getMetricsForUser(req.body.userID)
  res.json(userMetrics)
}

export default withAdminUserRoute(getUserMetrics)
