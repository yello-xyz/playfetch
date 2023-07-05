import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/src/common/formatting'
import { saveEndpoint } from '@/src/server/datastore/endpoints'
import { getURLPathForProject } from '@/src/server/datastore/projects'
import { Chain, PromptConfig, User } from '@/types'
import { saveChain } from '@/src/server/datastore/chains'

async function publishChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const chain = req.body.chain as Chain
  const projectID = req.body.projectID
  const name = req.body.name
  const flavor = req.body.flavor
  const useCache = req.body.useCache

  const chainID = await saveChain(userID, projectID, chain)

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await saveEndpoint(userID, projectID, chainID, urlPath, projectURLPath, flavor, useCache)

  res.json({})
}

export default withLoggedInUserRoute(publishChain)
