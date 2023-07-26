import { duplicateChainForUser } from '@/src/server/datastore/chains'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function duplicateChain(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const newChainID = await duplicateChainForUser(user.id, req.body.chainID)
  res.json(newChainID)
}

export default withLoggedInUserRoute(duplicateChain)
