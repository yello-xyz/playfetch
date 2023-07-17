import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { toggleFavoritePrompt as toggleFavorite } from '@/src/server/datastore/prompts'
import { User } from '@/types'

async function toggleFavoritePrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleFavorite(user.id, req.body.promptID, req.body.favorite)
  res.json({})
}

export default withLoggedInUserRoute(toggleFavoritePrompt)
