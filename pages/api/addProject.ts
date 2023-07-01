import { addProjectForUser } from '@/server/datastore/projects'
import { withLoggedInUserRoute } from '@/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addProject(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const projectID = await addProjectForUser(user.id, req.body.name)
  res.json(projectID)
}

export default withLoggedInUserRoute(addProject)
