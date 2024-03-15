import { getAnalyticsForProject } from '@/src/server/datastore/analytics'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User, Analytics } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getAnalytics(req: NextApiRequest, res: NextApiResponse<Analytics>, user: User) {
  const dayRange = Math.min(30, req.body.dayRange || 30)
  const analytics = await getAnalyticsForProject(user.id, req.body.projectID, false, dayRange, req.body.logEntryCursors)
  res.json(analytics)
}

export default withLoggedInUserRoute(getAnalytics)
