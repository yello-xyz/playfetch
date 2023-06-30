import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { toggleEndpointCache } from '@/server/datastore/endpoints'

async function toggleCache(req: NextApiRequest, res: NextApiResponse) {
  await toggleEndpointCache(req.session.user!.id, req.body.endpointID, req.body.useCache)
  res.json({})
}

export default withLoggedInSessionRoute(toggleCache)
