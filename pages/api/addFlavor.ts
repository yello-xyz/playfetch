import { withLoggedInUserRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { addProjectFlavor } from '@/server/datastore/projects'
import { User } from '@/types'

async function addFlavor(req: NextApiRequest, res: NextApiResponse, user: User) {
  await addProjectFlavor(user.id, req.body.projectID, req.body.flavor)
  res.json({})
}

export default withLoggedInUserRoute(addFlavor)
