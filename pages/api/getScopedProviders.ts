import { loadScopedProviders } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { AvailableProvider, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getScopedProviders(req: NextApiRequest, res: NextApiResponse<AvailableProvider[]>, user: User) {
  const availableProviders = await loadScopedProviders(req.body.scopeID)
  res.json(availableProviders)
}

export default withLoggedInUserRoute(getScopedProviders)
