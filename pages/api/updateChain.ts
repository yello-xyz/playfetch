import { saveChainVersionForUser } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateChain(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const versionID = await saveChainVersionForUser(user.id, req.body.chainID, req.body.items, req.body.versionID)
  res.json(versionID)
}

export default withLoggedInUserRoute(updateChain)
