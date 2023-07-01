import { revokeMemberAccessForProject } from '@/server/datastore/projects'
import { withLoggedInUserRoute } from '@/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function leaveProject(req: NextApiRequest, res: NextApiResponse, user: User) {
  await revokeMemberAccessForProject(user.id, req.body.projectID)
  res.json({})
}

export default withLoggedInUserRoute(leaveProject)
