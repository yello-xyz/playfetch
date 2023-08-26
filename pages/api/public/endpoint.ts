import { ParseQuery } from '@/src/client/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { getActiveEndpointFromPath } from '@/src/server/datastore/endpoints'
import { checkProject } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'
import { Endpoint, PromptInputs } from '@/types'
import { loadConfigsFromVersion } from '../runVersion'
import { saveLogEntry } from '@/src/server/datastore/logs'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain from '@/src/server/chainEngine'

const logResponse = (endpoint: Endpoint, inputs: PromptInputs, response: Awaited<ReturnType<typeof runChain>>) => {
  updateUsage(endpoint.id, response.cost, response.duration, response.cacheHit, response.attempts, response.failed)
  saveLogEntry(
    endpoint.projectID,
    endpoint.id,
    endpoint.urlPath,
    endpoint.flavor,
    endpoint.parentID,
    endpoint.versionID,
    inputs,
    response.result ? { output: response.result } : {},
    response.error,
    response.cost,
    response.duration,
    response.cacheHit,
    response.attempts
  )
}

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { projectID: projectIDFromPath, endpoint: endpointName } = ParseQuery(req.query)
  const projectID = Number(projectIDFromPath)

  if (projectID && endpointName) {
    const apiKey = req.headers['x-api-key'] as string
    const flavor = req.headers['x-environment'] as string | undefined

    if (apiKey && (await checkProject(projectID, apiKey))) {
      const endpoint = await getActiveEndpointFromPath(projectID, endpointName, flavor)
      if (endpoint && endpoint.enabled) {
        const useStreaming = endpoint.useStreaming
        if (useStreaming) {
          res.setHeader('X-Accel-Buffering', 'no')
        }

        const inputs = typeof req.body === 'string' ? {} : (req.body as PromptInputs)
        const version = await getTrustedVersion(endpoint.versionID)

        const configs = loadConfigsFromVersion(version)
        const isLastRun = (index: number) => index === configs.length - 1
        // TODO shortcut this when using caching for chain?
        const response = await runChain(
          endpoint.userID,
          version,
          configs,
          inputs,
          endpoint.useCache,
          true,
          (index, message) => (useStreaming && isLastRun(index) ? res.write(message) : undefined)
        )

        logResponse(endpoint, inputs, response)

        return useStreaming ? res.end() : res.json({ output: response.result })
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
