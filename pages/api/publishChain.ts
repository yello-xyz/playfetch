import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/src/common/formatting'
import { saveEndpoint } from '@/src/server/datastore/endpoints'
import { ensureProjectAPIKey, getURLPathForProject } from '@/src/server/datastore/projects'
import { User } from '@/types'

async function publishChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const versionID = req.body.versionID
  const projectID = req.body.projectID
  const parentID = req.body.parentID
  const name = req.body.name
  const flavor = req.body.flavor
  const useCache = req.body.useCache
  const useStreaming = req.body.useStreaming
  const inputs = req.body.inputs

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await ensureProjectAPIKey(userID, projectID)
  await saveEndpoint(userID, parentID, versionID, urlPath, projectURLPath, flavor, useCache, useStreaming, inputs)

  res.json({})
}

export default withLoggedInUserRoute(publishChain)
