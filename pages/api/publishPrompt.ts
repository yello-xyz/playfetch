import { withLoggedInUserRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/common/formatting'
import { saveEndpoint } from '@/server/datastore/endpoints'
import { getURLPathForProject } from '@/server/datastore/projects'
import { PromptConfig, User } from '@/types'

async function publishPrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const projectID = req.body.projectID
  const name = req.body.name
  const config = req.body.config as PromptConfig
  const useCache = req.body.useCache

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await saveEndpoint(
    userID,
    req.body.promptID,
    req.body.versionID,
    urlPath,
    projectURLPath,
    req.body.flavor,
    req.body.prompt,
    config,
    useCache
  )
  res.json({})
}

export default withLoggedInUserRoute(publishPrompt)
