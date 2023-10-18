import { getWorkspacesForUser } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { PendingWorkspace, User, Workspace } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getWorkspaces(_: NextApiRequest, res: NextApiResponse<[Workspace[], PendingWorkspace[]]>, user: User) {
  const workspaces = await getWorkspacesForUser(user.id)
  res.json(workspaces)
}

export default withLoggedInUserRoute(getWorkspaces)
