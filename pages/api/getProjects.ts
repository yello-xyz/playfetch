import { getProjectsForUser } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { Project, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getProjects(_: NextApiRequest, res: NextApiResponse<Project[]>, user: User) {
  const projects = await getProjectsForUser(user.id)
  res.json(projects)
}

export default withLoggedInUserRoute(getProjects)
