import { updateChainItems } from '@/src/server/datastore/chains'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateChainItems(user.id, req.body.chainID, req.body.items, req.body.inputs)
  res.json({})
}

export default withLoggedInUserRoute(updateChain)
