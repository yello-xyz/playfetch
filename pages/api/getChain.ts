import { getActiveChain } from '@/src/server/datastore/chains'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import { withLoggedInUserRoute } from '@/src/server/session'
import { ActiveChain, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getChain(req: NextApiRequest, res: NextApiResponse<ActiveChain>, user: User) {
  const chain = await getActiveChain(user.id, req.body.chainID, urlBuilderFromHeaders(req.headers))
  res.json(chain)
}

export default withLoggedInUserRoute(getChain)
