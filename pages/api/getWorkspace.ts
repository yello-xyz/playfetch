import { getActiveWorkspace } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { ActiveWorkspace, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getWorkspace(req: NextApiRequest, res: NextApiResponse<ActiveWorkspace>, user: User) {
  const workspace = await getActiveWorkspace(user.id, req.body.workspaceID)
  res.json(workspace)
}

export default withLoggedInUserRoute(getWorkspace)
