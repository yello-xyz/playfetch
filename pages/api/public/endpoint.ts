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
import { cacheValue, getCachedValue } from '@/src/server/datastore/cache'

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

type ResponseType = Awaited<ReturnType<typeof runChain>>

const getCacheKey = (versionID: number, inputs: PromptInputs) =>
  `${versionID}:${JSON.stringify(Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b)))}`

const cacheResponse = (versionID: number, inputs: PromptInputs, response: ResponseType, parentID: number) =>
  cacheValue(getCacheKey(versionID, inputs), JSON.stringify(response.result), { versionID, parentID })

const getCachedResponse = async (versionID: number, inputs: PromptInputs): Promise<ResponseType | null> => {
  const cachedValue = await getCachedValue(getCacheKey(versionID, inputs))
  return cachedValue
    ? {
        result: JSON.parse(cachedValue),
        output: '',
        error: undefined,
        duration: 0,
        cost: 0,
        failed: false,
        attempts: 1,
        cacheHit: true,
      }
    : null
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

        const versionID = endpoint.versionID
        const inputs = typeof req.body === 'string' ? {} : (req.body as PromptInputs)

        let response = endpoint.useCache ? await getCachedResponse(versionID, inputs) : null
        if (!response) {
          const version = await getTrustedVersion(versionID)

          const configs = loadConfigsFromVersion(version)
          const isLastRun = (index: number) => index === configs.length - 1
          const stream = (index: number, message: string) =>
            useStreaming && isLastRun(index) ? res.write(message) : undefined

          response = await runChain(endpoint.userID, version, configs, inputs, true, stream)

          if (endpoint.useCache && !response.failed) {
            cacheResponse(versionID, inputs, response, endpoint.parentID)
          }
        }

        logResponse(endpoint, inputs, response)

        return useStreaming ? res.end() : res.json({ output: response.result })
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default endpoint
