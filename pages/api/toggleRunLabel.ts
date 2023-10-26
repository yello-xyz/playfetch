import { updateRunLabel } from '@/src/server/datastore/runs'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function toggleRunLabel(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateRunLabel(user.id, req.body.runID, req.body.projectID, req.body.label, req.body.checked, req.body.replyTo)
  res.json({})
}

export default withLoggedInUserRoute(toggleRunLabel)
