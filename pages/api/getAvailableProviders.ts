import { loadScopedProviders } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { AvailableProvider, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getAvailableProviders(_: NextApiRequest, res: NextApiResponse<AvailableProvider[]>, user: User) {
  const availableProviders = await loadScopedProviders(user.id)
  res.json(availableProviders)
}

export default withLoggedInUserRoute(getAvailableProviders)
