import { deleteWorkspaceForUser } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteWorkspace(req: NextApiRequest, res: NextApiResponse, user: User) {
  await deleteWorkspaceForUser(user.id, req.body.workspaceID)
  res.json({})
}

export default withLoggedInUserRoute(deleteWorkspace)
