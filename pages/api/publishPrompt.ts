import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/src/common/formatting'
import { saveEndpoint } from '@/src/server/datastore/endpoints'
import { getURLPathForProject } from '@/src/server/datastore/projects'
import { RunConfig, User } from '@/types'

async function publishPrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const projectID = req.body.projectID
  const name = req.body.name
  const flavor = req.body.flavor
  const { promptID, versionID, prompt, config } = req.body.config as RunConfig
  const useCache = req.body.useCache

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await saveEndpoint(
    userID,
    promptID,
    versionID,
    urlPath,
    projectURLPath,
    flavor,
    prompt,
    config,
    useCache
  )
  res.json({})
}

export default withLoggedInUserRoute(publishPrompt)
