import { ParseQuery } from '@/client/clientRoute'
import { getEndpointFromPath, checkProject } from '@/server/datastore'
import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from '../runPrompt'
import { ToCamelCase } from '@/common/formatting'

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project: projectURLPath, endpoint: endpointName } = ParseQuery(req.query)
  const apiKey = (req.headers['x-api-key'] as string)

  if (apiKey && await checkProject(projectURLPath, apiKey)) {
    const endpoint = await getEndpointFromPath(endpointName, projectURLPath)
    if (endpoint) {
      const inputs = req.body
      const prompt = Object.keys(endpoint.config.inputs).reduce(
        (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
        endpoint.prompt
      )

      // TODO log output, cost, failures, etc.
      const { output } = await runPromptWithConfig(prompt, { ...endpoint.config, inputs })
      return res.json({ output })
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
