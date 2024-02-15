import { createTaskForVersion } from '@/src/server/providers/linear'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function createTask(req: NextApiRequest, res: NextApiResponse, user: User) {
  await createTaskForVersion(
    user.id,
    req.body.projectID,
    req.body.parentID,
    req.body.versionID,
    req.body.title,
    req.body.description
  )
  res.json({})
}

export default withLoggedInUserRoute(createTask)
