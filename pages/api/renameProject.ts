import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { updateProjectName } from '@/server/datastore/projects'

async function renameProject(req: NextApiRequest, res: NextApiResponse) {
  await updateProjectName(req.session.user!.id, req.body.projectID, req.body.name)
  res.json({})
}

export default withLoggedInSessionRoute(renameProject)
