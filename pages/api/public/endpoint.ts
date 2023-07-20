import { ParseQuery } from '@/components/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { getActiveEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'
import { CodeConfig, Endpoint, PromptInputs, RunConfig } from '@/types'
import { runChainConfigs } from '../runChain'
import { getChainItems } from '@/src/server/datastore/chains'

const loadConfigsFromEndpoint = async (endpoint: Endpoint): Promise<(RunConfig | CodeConfig)[]> => {
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
        const useStreaming = endpoint.useStreaming
        if (useStreaming) {
          res.setHeader('X-Accel-Buffering', 'no')
        }

        let totalCost = 0
        let extraAttempts = 0
        let anyCacheHit = false
        const startTime = process.hrtime.bigint()
        const updateAggregateUsage = async (
          isLastRun: boolean,
          cost: number,
          attempts: number,
          cacheHit: boolean,
          failed: boolean
        ) => {
          totalCost += cost
          extraAttempts += attempts - 1
          anyCacheHit = anyCacheHit || cacheHit
          if (isLastRun || failed) {
            const endTime = process.hrtime.bigint()
            const durationInSeconds = Number(endTime - startTime) / 1_000_000_000
            updateUsage(endpoint.id, totalCost, durationInSeconds, anyCacheHit, 1 + extraAttempts, failed)
          }
        }

        const inputs = typeof req.body === 'string' ? {} : (req.body as PromptInputs)
        const configs = await loadConfigsFromEndpoint(endpoint)
        const isLastRun = (index: number) => index === configs.length - 1
        const output = await runChainConfigs(
          endpoint.userID,
          configs,
          inputs,
          endpoint.useCache,
          true,
          (index, _, { cost, attempts, cacheHit, failed }) =>
            updateAggregateUsage(isLastRun(index), cost, attempts, cacheHit, failed),
          (index, message) => useStreaming && isLastRun(index) ? res.write(message) : undefined
        )
        return useStreaming ? res.end() : res.json({ output })
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
