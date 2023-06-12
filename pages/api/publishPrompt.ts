import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveEndpoint, rotateProjectAPIKey, getURLPathForProject } from '@/server/datastore'
import { buildURLForClientRoute } from '@/server/routing'
import { ToCamelCase } from '@/common/formatting'

async function publishPrompt(req: NextApiRequest, res: NextApiResponse<string>) {
  const userID = req.session.user!.id
  const projectID = req.body.projectID
  const name = req.body.name
  const rawConfig = req.body.config

  const prompt = Object.keys(rawConfig.inputs).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
    req.body.prompt
  )
  const config = {
    ...rawConfig,
    inputs: Object.fromEntries(
      Object.entries(rawConfig.inputs).map(([variable, value]) => [ToCamelCase(variable), value])
    ),
  }

  const projectURLPath = await getURLPathForProject(projectID)
  await saveEndpoint(userID, req.body.promptID, name, projectURLPath, prompt, config)

  const apiKey = await rotateProjectAPIKey(userID, projectID)
  const url = buildURLForClientRoute(`/${projectURLPath}/${name}`, req.headers)

  const curlCommand = `curl -X POST ${url} \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{ ${Object.entries(config.inputs).map(([variable, value]) => `"${variable}": "${value}"`).join(', ')} }'`

  res.json(curlCommand)
}

export default withLoggedInSessionRoute(publishPrompt)
