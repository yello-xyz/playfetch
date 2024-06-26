import { getSharedProjectsForUser } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { PendingProject, Project, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getSharedProjects(_: NextApiRequest, res: NextApiResponse<[Project[], PendingProject[]]>, user: User) {
  const projects = await getSharedProjectsForUser(user.id)
  res.json(projects)
}

export default withLoggedInUserRoute(getSharedProjects)
