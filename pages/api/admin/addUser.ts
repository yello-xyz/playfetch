import { saveUser } from '@/server/datastore'
import { withAdminRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addUser(req: NextApiRequest, res: NextApiResponse) {
  await saveUser(req.body.email, req.body.isAdmin)
  res.json({})
}

export default withAdminRoute(addUser)
