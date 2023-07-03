import { ParseQuery } from '@/components/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from '../runPrompt'
import { ExtractPromptVariables, ToCamelCase } from '@/src/common/formatting'
import { getEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'

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

      const { output, cost, attempts, cacheHit } = await runPromptWithConfig(
        prompt,
        endpoint.config,
        req.body,
        endpoint.useCache
      )
      await updateUsage(endpoint.id, endpoint.promptID, cost, cacheHit, attempts, !output?.length)
      return res.json({ output })
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
