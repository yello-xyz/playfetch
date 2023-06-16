import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveEndpoint, rotateProjectAPIKey, getURLPathForProject } from '@/server/datastore'
import { buildURLForClientRoute } from '@/server/routing'
import { ToCamelCase } from '@/common/formatting'

async function publishPrompt(req: NextApiRequest, res: NextApiResponse<string>) {
  const userID = req.session.user!.id
  const projectID = req.body.projectID
  const name = req.body.name
  const config = req.body.config

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(projectID)
  await saveEndpoint(userID, req.body.promptID, urlPath, projectURLPath, req.body.prompt, config)

  const apiKey = await rotateProjectAPIKey(userID, projectID)
  const url = buildURLForClientRoute(`/${projectURLPath}/${urlPath}`, req.headers)

  const curlCommand = `curl -X POST ${url} \\
  -H "x-api-key: ${apiKey}" \\
  -H "content-type: application/json" \\
  -d '{ ${Object.entries(config.inputs)
    .map(([variable, value]) => `"${ToCamelCase(variable)}": "${value}"`)
    .join(', ')} }'`

  res.json(curlCommand)
}

export default withLoggedInSessionRoute(publishPrompt)
