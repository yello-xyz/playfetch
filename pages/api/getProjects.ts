import { getGroupedPromptsForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import { Project } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getProjects(req: NextApiRequest, res: NextApiResponse<Project[]>) {
  const { projects } = await getGroupedPromptsForUser(req.session.user!.id)
  res.json(projects)
}

export default withLoggedInSessionRoute(getProjects)
