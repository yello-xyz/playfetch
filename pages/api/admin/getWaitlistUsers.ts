import { getUsersWithoutAccess } from '@/src/server/datastore/users'
import { withAdminUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getWaitlistUsers(_: NextApiRequest, res: NextApiResponse<User[]>) {
  const waitlistUsers = await getUsersWithoutAccess()
  res.json(waitlistUsers)
}

export default withAdminUserRoute(getWaitlistUsers)
