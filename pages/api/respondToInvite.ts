import { updateAccessForUser } from '@/src/server/datastore/access'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function respondToInvite(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateAccessForUser(user.id, req.body.objectID, req.body.accept === true)
  res.json({})
}

export default withLoggedInUserRoute(respondToInvite)
