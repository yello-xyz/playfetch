import { getActiveProject } from '@/server/datastore/projects'
import { withLoggedInSessionRoute } from '@/server/session'
import { ActiveProject } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getProject(req: NextApiRequest, res: NextApiResponse<ActiveProject>) {
  const project = await getActiveProject(req.session.user!.id, req.body.projectID ?? null)
  res.json(project)
}

export default withLoggedInSessionRoute(getProject)
