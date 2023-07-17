import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@/types'
import { updateChainName } from '@/src/server/datastore/chains'

async function renameChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateChainName(user.id, req.body.chainID, req.body.name)
  res.json({})
}

export default withLoggedInUserRoute(renameChain)
