import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { toggleEndpointForUser } from '@/src/server/datastore/endpoints'
import { User } from '@/types'

async function toggleEndpoint(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleEndpointForUser(user.id, req.body.endpointID, req.body.enabled, req.body.useCache)
  res.json({})
}

export default withLoggedInUserRoute(toggleEndpoint)
