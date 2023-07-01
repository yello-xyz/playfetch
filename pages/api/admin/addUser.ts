import { saveUser } from '@/server/datastore/users'
import { withAdminUserRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addUser(req: NextApiRequest, res: NextApiResponse) {
  await saveUser(req.body.email, req.body.avatarColor, req.body.isAdmin)
  res.json({})
}

export default withAdminUserRoute(addUser)
