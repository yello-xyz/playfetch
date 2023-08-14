import { getLogEntriesForProject } from '@/src/server/datastore/logs'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User, LogEntry } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getLogEntries(req: NextApiRequest, res: NextApiResponse<LogEntry[]>, user: User) {
  const logEntries = await getLogEntriesForProject(user.id, req.body.projectID)
  res.json(logEntries)
}

export default withLoggedInUserRoute(getLogEntries)
