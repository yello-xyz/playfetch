import { addProjectForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addProject(req: NextApiRequest, res: NextApiResponse) {
  await addProjectForUser(req.session.user!.id)
  res.json({})
}

export default withLoggedInSessionRoute(addProject)
