import { deleteEndpointForUser } from '@/src/server/datastore/endpoints'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteEndpoint(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const endpointID = req.body.endpointID

  await deleteEndpointForUser(userID, endpointID)

  res.json({})
}

export default withLoggedInUserRoute(deleteEndpoint)
