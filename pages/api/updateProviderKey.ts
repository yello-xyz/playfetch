import { saveProviderKey } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateProviderKey(req: NextApiRequest, res: NextApiResponse, user: User) {
  await saveProviderKey(user.id, req.body.provider, req.body.apiKey, req.body.environment)
  res.json({})
}

export default withLoggedInUserRoute(updateProviderKey)
