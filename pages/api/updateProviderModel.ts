import { saveProviderModel } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateProviderModel(req: NextApiRequest, res: NextApiResponse, user: User) {
  await saveProviderModel(
    user.id,
    req.body.scopeID,
    req.body.provider,
    req.body.modelID,
    req.body.name,
    req.body.description,
    req.body.enabled
  )
  res.json({})
}

export default withLoggedInUserRoute(updateProviderModel)
