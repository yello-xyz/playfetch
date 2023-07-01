import { deleteVersionForUser } from '@/server/datastore/versions'
import { withLoggedInUserRoute } from '@/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteVersion(req: NextApiRequest, res: NextApiResponse, user: User) {
  await deleteVersionForUser(user.id, req.body.versionID)
  res.json({})
}

export default withLoggedInUserRoute(deleteVersion)
