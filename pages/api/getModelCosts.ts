import { getModelCostsForScope } from '@/src/server/datastore/cost'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User, ModelCosts } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getModelCosts(req: NextApiRequest, res: NextApiResponse<ModelCosts[]>, user: User) {
  const analytics = await getModelCostsForScope(user.id, req.body.scopeID)
  res.json(analytics)
}

export default withLoggedInUserRoute(getModelCosts)
