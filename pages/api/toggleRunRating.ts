import { updateRunRating } from '@/src/server/datastore/runs'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function toggleRunRating(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateRunRating(user.id, req.body.runID, req.body.projectID, req.body.rating, req.body.replyTo)
  res.json({})
}

export default withLoggedInUserRoute(toggleRunRating)
