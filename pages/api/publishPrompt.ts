import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveEndpoint, rotateProjectAPIKey } from '@/server/datastore'

const toCamelCase = (s: string) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())

async function publishPrompt(req: NextApiRequest, res: NextApiResponse) {
  const userID = req.session.user!.id
  const projectID = req.body.projectID
  const rawConfig = req.body.config

  const prompt = Object.keys(rawConfig.inputs).reduce(
    (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${toCamelCase(variable)}}}`),
    req.body.prompt
  )
  const config = {
    ...rawConfig,
    inputs: Object.fromEntries(
      Object.entries(rawConfig.inputs).map(([variable, value]) => [toCamelCase(variable), value])
    ),
  }

  await saveEndpoint(userID, req.body.name, projectID, req.body.promptID, prompt, config)

  const apiKey = await rotateProjectAPIKey(userID, projectID)

  const curlCommand = `curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{ ${Object.entries(config.inputs).map(([variable, value]) => `"${variable}": "${value}"`).join(', ')} }'`

  res.json({ curlCommand })
}

export default withLoggedInSessionRoute(publishPrompt)
