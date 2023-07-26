import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@/types'
import { updateProjectWorkspace } from '@/src/server/datastore/projects'

async function moveProject(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateProjectWorkspace(user.id, req.body.projectID, req.body.workspaceID)
  res.json({})
}

export default withLoggedInUserRoute(moveProject)
