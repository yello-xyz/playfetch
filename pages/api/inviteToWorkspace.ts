import logUserRequest, { InviteEvent } from '@/src/server/analytics'
import { inviteMembersToWorkspace } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function inviteToWorkspace(req: NextApiRequest, res: NextApiResponse, user: User) {
  const workspaceID = req.body.workspaceID
  logUserRequest(req, res, user.id, InviteEvent('workspace', workspaceID))
  await inviteMembersToWorkspace(user.id, workspaceID, req.body.emails)
  res.json({})
}

export default withLoggedInUserRoute(inviteToWorkspace)
