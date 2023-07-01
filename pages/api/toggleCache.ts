import { withLoggedInUserRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { toggleEndpointCache } from '@/server/datastore/endpoints'
import { User } from '@/types'

async function toggleCache(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleEndpointCache(user.id, req.body.endpointID, req.body.useCache)
  res.json({})
}

export default withLoggedInUserRoute(toggleCache)
