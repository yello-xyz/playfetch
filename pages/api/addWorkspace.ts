import logUserRequest, { CreateEvent } from '@/src/server/analytics'
import { addWorkspaceForUser } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addWorkspace(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const workspaceID = await addWorkspaceForUser(user.id, req.body.name)
  logUserRequest(req, res, user.id, CreateEvent('workspace', workspaceID))
  res.json(workspaceID)
}

export default withLoggedInUserRoute(addWorkspace)
