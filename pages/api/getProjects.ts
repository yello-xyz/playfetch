import { getProjectsForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import { Project, Prompt } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getProjects(req: NextApiRequest, res: NextApiResponse<{ prompts: Prompt[]; projects: Project[] }>) {
  const { prompts, projects } = await getProjectsForUser(req.session.user!.id)
  res.json({ prompts, projects })
}

export default withLoggedInSessionRoute(getProjects)
