import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@/types'
import { toggleFavoriteProject as toggleFavorite } from '@/src/server/datastore/projects'

async function toggleFavoriteProject(req: NextApiRequest, res: NextApiResponse, user: User) {
  await toggleFavorite(user.id, req.body.projectID, req.body.favorite)
  res.json({})
}

export default withLoggedInUserRoute(toggleFavoriteProject)
