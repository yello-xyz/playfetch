import { addChainForUser } from '@/src/server/datastore/chains'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addChain(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const { chainID } = await addChainForUser(user.id, req.body.projectID)
  res.json(chainID)
}

export default withLoggedInUserRoute(addChain)
