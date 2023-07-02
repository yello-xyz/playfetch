import { getActiveProject } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { ActiveProject, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getProject(req: NextApiRequest, res: NextApiResponse<ActiveProject>, user: User) {
  const project = await getActiveProject(user.id, req.body.projectID)
  res.json(project)
}

export default withLoggedInUserRoute(getProject)
