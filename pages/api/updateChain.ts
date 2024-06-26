import logUserRequest, { CreateEvent } from '@/src/server/analytics'
import { saveChainVersionForUser } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateChain(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const chainID = req.body.chainID
  logUserRequest(req, res, user.id, CreateEvent('version', chainID))
  const versionID = await saveChainVersionForUser(
    user.id,
    chainID,
    req.body.items,
    req.body.versionID,
    req.body.previousVersionID
  )
  res.json(versionID)
}

export default withLoggedInUserRoute(updateChain)
