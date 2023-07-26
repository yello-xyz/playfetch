import { inviteMembersToWorkspace } from '@/src/server/datastore/workspaces'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function inviteToWorkspace(req: NextApiRequest, res: NextApiResponse, user: User) {
  await inviteMembersToWorkspace(user.id, req.body.workspaceID, req.body.emails)
  res.json({})
}

export default withLoggedInUserRoute(inviteToWorkspace)
