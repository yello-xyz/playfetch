import { deleteProjectForUser } from '@/server/datastore/projects'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteProject(req: NextApiRequest, res: NextApiResponse) {
  await deleteProjectForUser(req.session.user!.id, req.body.projectID)
  res.json({})
}

export default withLoggedInSessionRoute(deleteProject)
