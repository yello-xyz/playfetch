import { getUsersWithoutAccess } from '@/src/server/datastore/users'
import { withAdminUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getActiveUsers(_: NextApiRequest, res: NextApiResponse<User[]>) {
  const activeUsers = await getUsersWithoutAccess()
  res.json(activeUsers)
}

export default withAdminUserRoute(getActiveUsers)
