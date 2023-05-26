import { addProjectForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addProject(req: NextApiRequest, res: NextApiResponse<number>) {
  const promptID = await addProjectForUser(req.session.user!.id)
  res.json(promptID)
}

export default withLoggedInSessionRoute(addProject)
