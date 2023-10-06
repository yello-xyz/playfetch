import { getAvailableProvidersForUser } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { AvailableProvider, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getAvailableProviders(_: NextApiRequest, res: NextApiResponse<AvailableProvider[]>, user: User) {
  const availableProviders = await getAvailableProvidersForUser(user.id, true)
  res.json(availableProviders)
}

export default withLoggedInUserRoute(getAvailableProviders)
