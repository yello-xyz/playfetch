import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@/types'
import { toggleFavoriteChain as toggleFavorite } from '@/src/server/datastore/chains'

async function toggleFavoriteChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleFavorite(user.id, req.body.chainID, req.body.favorite)
  res.json({})
}

export default withLoggedInUserRoute(toggleFavoriteChain)
