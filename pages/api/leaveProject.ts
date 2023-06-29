import { revokeMemberAccessForProject } from '@/server/datastore/projects'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function leaveProject(req: NextApiRequest, res: NextApiResponse) {
  await revokeMemberAccessForProject(req.session.user!.id, req.body.projectID)
  res.json({})
}

export default withLoggedInSessionRoute(leaveProject)
