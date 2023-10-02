import { getAnalyticsForProject } from '@/src/server/datastore/analytics'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User, Analytics } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getAnalytics(req: NextApiRequest, res: NextApiResponse<Analytics>, user: User) {
  const analytics = await getAnalyticsForProject(user.id, req.body.projectID, true)
  res.json(analytics)
}

export default withLoggedInUserRoute(getAnalytics)
