import { saveUser } from '@/src/server/datastore/users'
import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addUser(req: NextApiRequest, res: NextApiResponse) {
  await saveUser(req.body.email, req.body.fullName, true, req.body.isAdmin)
  res.json({})
}

export default withAdminUserRoute(addUser)
