import logUserRequest, { InviteEvent } from '@/src/server/analytics'
import { inviteMembersToProject } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function inviteToProject(req: NextApiRequest, res: NextApiResponse, user: User) {
  const projectID = req.body.projectID
  logUserRequest(req, res, user.id, InviteEvent('project', projectID))
  await inviteMembersToProject(user.id, projectID, req.body.emails)
  res.json({})
}

export default withLoggedInUserRoute(inviteToProject)
