import { getActiveChain } from '@/src/server/datastore/chains'
import { withLoggedInUserRoute } from '@/src/server/session'
import { Chain, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getChain(req: NextApiRequest, res: NextApiResponse<Chain>, user: User) {
  const chain = await getActiveChain(user.id, req.body.chainID)
  res.json(chain)
}

export default withLoggedInUserRoute(getChain)
