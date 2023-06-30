import { ParseQuery } from '@/client/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from '../runPrompt'
import { ExtractPromptVariables, ToCamelCase } from '@/common/formatting'
import { getEndpointFromPath } from '@/server/datastore/endpoints'
import { checkProject } from '@/server/datastore/projects'

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project: projectURLPath, endpoint: endpointName } = ParseQuery(req.query)
  const apiKey = req.headers['x-api-key'] as string

  if (apiKey && projectURLPath && endpointName && (await checkProject(projectURLPath, apiKey))) {
    // TODO decide which flavor to use and pass in below
    const endpoint = await getEndpointFromPath(endpointName, projectURLPath)
    if (endpoint) {
      const prompt = ExtractPromptVariables(endpoint.prompt).reduce(
        (prompt, variable) => prompt.replaceAll(`{{${variable}}}`, `{{${ToCamelCase(variable)}}}`),
        endpoint.prompt
      )

      // TODO log output, cost, failures, etc.
      const { output } = await runPromptWithConfig(prompt, endpoint.config, req.body, endpoint.useCache)
      return res.json({ output })
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
