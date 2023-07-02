import { deleteProjectForUser } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteProject(req: NextApiRequest, res: NextApiResponse, user: User) {
  await deleteProjectForUser(user.id, req.body.projectID)
  res.json({})
}

export default withLoggedInUserRoute(deleteProject)
