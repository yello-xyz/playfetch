import { loadAvailableProviders } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { AvailableProvider, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getAvailableProviders(req: NextApiRequest, res: NextApiResponse<AvailableProvider[]>, user: User) {
  const availableProviders = await loadAvailableProviders([req.body.projectID, user.id])
  res.json(availableProviders)
}

export default withLoggedInUserRoute(getAvailableProviders)
