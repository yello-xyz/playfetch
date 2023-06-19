import { deleteEndpointForUser } from '@/server/datastore/endpoints'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function unpublishPrompt(req: NextApiRequest, res: NextApiResponse) {
  const userID = req.session.user!.id
  const promptID = req.body.promptID

  await deleteEndpointForUser(userID, promptID)

  res.json({})
}

export default withLoggedInSessionRoute(unpublishPrompt)
