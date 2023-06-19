import { deleteVersionForUser } from '@/server/datastore/versions'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteVersion(req: NextApiRequest, res: NextApiResponse) {
  await deleteVersionForUser(req.session.user!.id, req.body.versionID)
  res.json({})
}

export default withLoggedInSessionRoute(deleteVersion)
