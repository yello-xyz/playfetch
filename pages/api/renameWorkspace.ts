import { updateWorkspaceName } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@/types'

async function renameWorkspace(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateWorkspaceName(user.id, req.body.workspaceID, req.body.name)
  res.json({})
}

export default withLoggedInUserRoute(renameWorkspace)
