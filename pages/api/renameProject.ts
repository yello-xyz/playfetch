import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { updateProjectName } from '@/src/server/datastore/projects'
import { User } from '@/types'

async function renameProject(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateProjectName(user.id, req.body.projectID, req.body.name)
  res.json({})
}

export default withLoggedInUserRoute(renameProject)
