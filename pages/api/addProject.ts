import { addProjectForUser } from '@/server/datastore/projects'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addProject(req: NextApiRequest, res: NextApiResponse<number>) {
  const projectID = await addProjectForUser(req.session.user!.id, req.body.name)
  res.json(projectID)
}

export default withLoggedInSessionRoute(addProject)
