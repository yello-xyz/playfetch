import logUserEvent, { CreateEvent } from '@/src/server/analytics'
import { addChainForUser } from '@/src/server/datastore/chains'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addChain(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const projectID = req.body.projectID
  logUserEvent(req, res, user.id, CreateEvent('chain', projectID))
  const { chainID } = await addChainForUser(user.id, projectID)
  res.json(chainID)
}

export default withLoggedInUserRoute(addChain)
