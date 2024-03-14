import { revokeMemberAccessForWorkspace } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function leaveWorkspace(req: NextApiRequest, res: NextApiResponse, user: User) {
  await revokeMemberAccessForWorkspace(user.id, req.body.memberID ?? user.id, req.body.workspaceID)
  res.json({})
}

export default withLoggedInUserRoute(leaveWorkspace)
