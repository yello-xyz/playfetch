import { inviteMembersToProject } from '@/src/server/datastore/projects'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function inviteToProject(req: NextApiRequest, res: NextApiResponse, user: User) {
  await inviteMembersToProject(user.id, req.body.projectID, req.body.emails)
  res.json({})
}

export default withLoggedInUserRoute(inviteToProject)
