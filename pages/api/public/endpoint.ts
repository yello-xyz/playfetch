import { ParseQuery } from '@/client/clientRoute'
import { getEndpointForProject, getProjectIDFromURLPath } from '@/server/datastore'
import { NextApiRequest, NextApiResponse } from 'next'
import { runPromptWithConfig } from '../runPrompt'

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project, endpoint: endpointName } = ParseQuery(req.query)
  const apiKey = (req.headers['x-api-key'] as string) ?? 'invalid-api-key'

  const projectID = await getProjectIDFromURLPath(project, apiKey)

  if (projectID) {
    const endpoint = await getEndpointForProject(projectID, endpointName)
    if (endpoint) {
      // TODO log output, cost, failures, etc.
      const { output } = await runPromptWithConfig(endpoint.prompt, { ...endpoint.config, inputs: req.body })
      return res.json({ output })
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
