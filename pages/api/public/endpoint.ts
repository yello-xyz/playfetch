import { ParseQuery } from '@/components/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from '../runPrompt'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import { getEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project: projectURLPath, endpoint: endpointName } = ParseQuery(req.query)
  const apiKey = req.headers['x-api-key'] as string
  const flavor = req.headers['x-environment'] as string | undefined

  if (apiKey && projectURLPath && endpointName && (await checkProject(projectURLPath, apiKey))) {
    const endpoint = await getEndpointFromPath(endpointName, projectURLPath, flavor)
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
