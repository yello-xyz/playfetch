import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { updateEndpointForUser } from '@/src/server/datastore/endpoints'
import { User } from '@/types'
import { ToCamelCase } from '@/src/common/formatting'

async function updateEndpoint(req: NextApiRequest, res: NextApiResponse, user: User) {
  const urlPath = ToCamelCase(req.body.name)

  await updateEndpointForUser(
    user.id,
    req.body.endpointID,
    req.body.enabled,
    req.body.parentID,
    req.body.versionID,
    urlPath,
    req.body.flavor,
    req.body.useCache,
    req.body.useStreaming
  )

  res.json({})
}

export default withLoggedInUserRoute(updateEndpoint)
