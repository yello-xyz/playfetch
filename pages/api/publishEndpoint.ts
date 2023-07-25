import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/src/common/formatting'
import { saveEndpoint } from '@/src/server/datastore/endpoints'
import { ensureProjectAPIKey } from '@/src/server/datastore/projects'
import { User } from '@/types'

async function publishEndpoint(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const projectID = req.body.projectID
  const parentID = req.body.parentID
  const versionID = req.body.versionID
  const name = req.body.name
  const flavor = req.body.flavor
  const useCache = req.body.useCache
  const useStreaming = req.body.useStreaming

  const urlPath = ToCamelCase(name)
  await ensureProjectAPIKey(userID, projectID)
  await saveEndpoint(userID, projectID, parentID, versionID, urlPath, flavor, useCache, useStreaming)

  res.json({})
}

export default withLoggedInUserRoute(publishEndpoint)
