import { withLoggedInUserRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { toggleFavoritePrompt } from '@/server/datastore/prompts'
import { User } from '@/types'

async function toggleFavorite(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleFavoritePrompt(user.id, req.body.promptID, req.body.favorite)
  res.json({})
}

export default withLoggedInUserRoute(toggleFavorite)
