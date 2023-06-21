import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { buildURLForClientRoute } from '@/server/routing'
import { ToCamelCase } from '@/common/formatting'
import { saveEndpoint } from '@/server/datastore/endpoints'
import { getURLPathForProject, rotateProjectAPIKey } from '@/server/datastore/projects'
import { PromptConfig, PromptInputs } from '@/types'

async function publishPrompt(req: NextApiRequest, res: NextApiResponse<string>) {
  const userID = req.session.user!.id
  const projectID = req.body.projectID
  const name = req.body.name
  const config = req.body.config as PromptConfig
  const inputs = req.body.inputs as PromptInputs
  const useCache = req.body.useCache

  const urlPath = ToCamelCase(name)
  const projectURLPath = await getURLPathForProject(userID, projectID)
  await saveEndpoint(userID, req.body.promptID, urlPath, projectURLPath, req.body.prompt, config, useCache)

  const apiKey = await rotateProjectAPIKey(userID, projectID)
  const url = buildURLForClientRoute(`/${projectURLPath}/${urlPath}`, req.headers)

  const curlCommand = Object.entries(inputs).length
    ? `curl -X POST ${url} \\
  -H "x-api-key: ${apiKey}" \\
  -H "content-type: application/json" \\
  -d '{ ${Object.entries(inputs)
    .map(([variable, value]) => `"${ToCamelCase(variable)}": "${value}"`)
    .join(', ')} }'`
    : `curl -X POST ${url} -H "x-api-key: ${apiKey}"`

  res.json(curlCommand)
}

export default withLoggedInSessionRoute(publishPrompt)
