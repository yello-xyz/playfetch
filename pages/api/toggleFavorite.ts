import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { toggleFavoritePrompt } from '@/server/datastore/prompts'

async function toggleFavorite(req: NextApiRequest, res: NextApiResponse) {
  await toggleFavoritePrompt(req.session.user!.id, req.body.promptID, req.body.favorite)
  res.json({})
}

export default withLoggedInSessionRoute(toggleFavorite)
