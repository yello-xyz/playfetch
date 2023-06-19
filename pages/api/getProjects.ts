import { getProjectsForUser } from '@/server/datastore/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import { Project } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getProjects(req: NextApiRequest, res: NextApiResponse<Project[]>) {
  const projects = await getProjectsForUser(req.session.user!.id)
  res.json(projects)
}

export default withLoggedInSessionRoute(getProjects)
