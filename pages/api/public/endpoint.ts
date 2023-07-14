import { ParseQuery } from '@/components/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { getActiveEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'
import { PromptInputs, Version } from '@/types'
import { runPromptConfigs } from '../runChain'

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project: projectURLPath, endpoint: endpointName } = ParseQuery(req.query)

  if (projectURLPath && endpointName) {
    const apiKey = req.headers['x-api-key'] as string
    const flavor = req.headers['x-environment'] as string | undefined

    if (apiKey && (await checkProject(projectURLPath, apiKey))) {
      const endpoint = await getActiveEndpointFromPath(endpointName, projectURLPath, flavor)
      if (endpoint && endpoint.enabled) {
        const inputs = typeof req.body === 'string' ? {} : (req.body as PromptInputs)
        const output = await runPromptConfigs(
          endpoint.userID,
          endpoint.chain,
          inputs,
          endpoint.useCache,
          true,
          (version: Version, { output, cost, attempts, cacheHit }) =>
            updateUsage(endpoint.id, version.promptID, cost, cacheHit, attempts, !output?.length)
        )
        return res.json({ output })
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
