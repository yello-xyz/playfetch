import { getAnalyticsForProject } from '@/src/server/datastore/analytics'
import { getLogEntriesForProject } from '@/src/server/datastore/logs'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User, LogEntry, Analytics } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getLogEntries(req: NextApiRequest, res: NextApiResponse<{ logs: LogEntry[], analytics: Analytics }>, user: User) {
  const logs = await getLogEntriesForProject(user.id, req.body.projectID)
  const analytics = await getAnalyticsForProject(user.id, req.body.projectID, true)
  res.json({ logs, analytics })
}

export default withLoggedInUserRoute(getLogEntries)
