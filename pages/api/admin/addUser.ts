import { saveUser } from '@/server/datastore'
import { withAdminRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addUser(req: NextApiRequest, res: NextApiResponse) {
  await saveUser({ email: req.body.email, isAdmin: req.body.isAdmin })
  res.json({})
}

export default withAdminRoute(addUser)
