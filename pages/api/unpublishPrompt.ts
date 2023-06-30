import { deleteEndpointForUser } from '@/server/datastore/endpoints'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function unpublishPrompt(req: NextApiRequest, res: NextApiResponse) {
  const userID = req.session.user!.id
  const endpointID = req.body.endpointID

  await deleteEndpointForUser(userID, endpointID)

  res.json({})
}

export default withLoggedInSessionRoute(unpublishPrompt)
