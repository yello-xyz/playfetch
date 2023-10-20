import { getActiveUsers as getActiveUsersBefore } from '@/src/server/datastore/users'
import { withAdminUserRoute } from '@/src/server/session'
import { ActiveUser } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getActiveUsers(req: NextApiRequest, res: NextApiResponse<ActiveUser[]>) {
  const activeUsers = await getActiveUsersBefore(undefined, new Date(req.body.before))
  res.json(activeUsers)
}

export default withAdminUserRoute(getActiveUsers)
