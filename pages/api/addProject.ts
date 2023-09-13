import logUserRequest, { CreateEvent } from '@/src/server/analytics'
import { addProjectForUser } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addProject(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const workspaceID = req.body.workspaceID
  logUserRequest(req, res, user.id, CreateEvent('project', workspaceID))
  const projectID = await addProjectForUser(user.id, workspaceID)
  res.json(projectID)
}

export default withLoggedInUserRoute(addProject)
