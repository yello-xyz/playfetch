import { toggleOwnershipForWorkspace } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function toggleWorkspaceOwnership(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleOwnershipForWorkspace(user.id, req.body.memberID, req.body.workspaceID, req.body.isOwner)
  res.json({})
}

export default withLoggedInUserRoute(toggleWorkspaceOwnership)
