import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { addProjectFlavor } from '@/server/datastore/projects'

async function addFlavor(req: NextApiRequest, res: NextApiResponse) {
  await addProjectFlavor(req.session.user!.id, req.body.projectID, req.body.flavor)
  res.json({})
}

export default withLoggedInSessionRoute(addFlavor)
