import { deleteChainForUser } from '@/src/server/datastore/chains'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  await deleteChainForUser(user.id, req.body.chainID)
  res.json({})
}

export default withLoggedInUserRoute(deleteChain)
