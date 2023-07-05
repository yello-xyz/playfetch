import { toggleVersionLabel } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function toggleLabel(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleVersionLabel(user.id, req.body.versionID, req.body.projectID, req.body.label, req.body.checked)
  res.json({})
}

export default withLoggedInUserRoute(toggleLabel)
