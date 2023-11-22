import { revokeMemberAccessForProject } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function revokeProjectAccess(req: NextApiRequest, res: NextApiResponse, user: User) {
  await revokeMemberAccessForProject(user.id, req.body.memberID ?? user.id, req.body.projectID)
  res.json({})
}

export default withLoggedInUserRoute(revokeProjectAccess)
