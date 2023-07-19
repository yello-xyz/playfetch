import { ParseQuery } from '@/components/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { getActiveEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'
import { Endpoint, PromptInputs, RunConfig } from '@/types'
import { runChainConfigs } from '../runChain'
import { getChainItems } from '@/src/server/datastore/chains'

const loadRunConfigsFromEndpoint = async (endpoint: Endpoint): Promise<RunConfig[]> => {
  if (endpoint.versionID) {
    return [{ versionID: endpoint.versionID }]
  } else {
    return getChainItems(endpoint.parentID)
  }
}

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { project: projectURLPath, endpoint: endpointName } = ParseQuery(req.query)

  if (projectURLPath && endpointName) {
    const apiKey = req.headers['x-api-key'] as string
    const flavor = req.headers['x-environment'] as string | undefined

    if (apiKey && (await checkProject(projectURLPath, apiKey))) {
      const endpoint = await getActiveEndpointFromPath(endpointName, projectURLPath, flavor)
      if (endpoint && endpoint.enabled) {
        const inputs = typeof req.body === 'string' ? {} : (req.body as PromptInputs)
        const runConfigs = await loadRunConfigsFromEndpoint(endpoint)
        const output = await runChainConfigs(
          endpoint.userID,
          runConfigs,
          inputs,
          endpoint.useCache,
          true,
          (_, { cost, attempts, cacheHit, failed }) =>
            // TODO usage will seem off for chain endpoints if we update usage for each chain item
            updateUsage(endpoint.id, cost, cacheHit, attempts, failed)
        )
        return res.json({ output })
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
