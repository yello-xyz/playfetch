import { getChainForUser } from '@/src/server/datastore/chains'
import { withLoggedInUserRoute } from '@/src/server/session'
import { ActiveChain, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getChain(req: NextApiRequest, res: NextApiResponse<ActiveChain>, user: User) {
  const chain = await getChainForUser(user.id, req.body.chainID)
  res.json(chain)
}

export default withLoggedInUserRoute(getChain)
