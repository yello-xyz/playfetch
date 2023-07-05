import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ToCamelCase } from '@/src/common/formatting'
import { saveEndpoint } from '@/src/server/datastore/endpoints'
import { getURLPathForProject } from '@/src/server/datastore/projects'
import { User } from '@/types'
import { getVersionWithoutRuns } from '@/src/server/datastore/versions'

async function publishPrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  const userID = user.id
  const versionID = req.body.versionID
  const projectID = req.body.projectID
  const name = req.body.name
  const flavor = req.body.flavor
  const useCache = req.body.useCache

  const version = await getVersionWithoutRuns(versionID)
  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await saveEndpoint(
    userID,
    version.promptID,
    [{ promptID: version.promptID, versionID }],
    urlPath,
    projectURLPath,
    flavor,
    useCache
  )
  res.json({})
}

export default withLoggedInUserRoute(publishPrompt)
