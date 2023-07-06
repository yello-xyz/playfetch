import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/src/common/formatting'
import { saveEndpoint } from '@/src/server/datastore/endpoints'
import { ensureProjectAPIKey, getURLPathForProject } from '@/src/server/datastore/projects'
import { Chain, User } from '@/types'

async function publishChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const chain = req.body.chain as Chain
  const projectID = req.body.projectID
  const promptID = req.body.promptID
  const name = req.body.name
  const flavor = req.body.flavor
  const useCache = req.body.useCache

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await ensureProjectAPIKey(projectID, userID)
  await saveEndpoint(userID, promptID, chain, urlPath, projectURLPath, flavor, useCache)

  res.json({})
}

export default withLoggedInUserRoute(publishChain)
