import { loadScopedProviders } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { AvailableProvider, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getScopedProviders(req: NextApiRequest, res: NextApiResponse<AvailableProvider[]>, user: User) {
  const scopedProviders = await loadScopedProviders(req.body.projectID ?? user.id)
  res.json(scopedProviders)
}

export default withLoggedInUserRoute(getScopedProviders)
