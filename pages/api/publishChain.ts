import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/src/common/formatting'
import { saveEndpoint } from '@/src/server/datastore/endpoints'
import { getURLPathForProject } from '@/src/server/datastore/projects'
import { PromptConfig, User } from '@/types'

async function publishChain(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const projectID = req.body.projectID
  const name = req.body.name
  const flavor = req.body.flavor
  const useCache = req.body.useCache

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await saveEndpoint(userID, projectID, 0, urlPath, projectURLPath, flavor, '', {} as PromptConfig, useCache)

  res.json({})
}

export default withLoggedInUserRoute(publishChain)
