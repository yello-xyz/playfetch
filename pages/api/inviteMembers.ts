import { inviteMembersToProject } from '@/server/datastore/projects'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function inviteMembers(req: NextApiRequest, res: NextApiResponse) {
  await inviteMembersToProject(req.session.user!.id, req.body.projectID, req.body.emails)
  res.json({})
}

export default withLoggedInSessionRoute(inviteMembers)
