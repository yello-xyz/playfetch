import { toggleOwnershipForProject } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function toggleProjectOwnership(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleOwnershipForProject(user.id, req.body.memberID, req.body.projectID, req.body.isOwner)
  res.json({})
}

export default withLoggedInUserRoute(toggleProjectOwnership)
