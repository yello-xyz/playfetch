import { ParseQuery } from '@/src/common/clientRoute'
import { NextApiRequest, NextApiResponse } from 'next'
import { getActiveEndpointFromPath } from '@/src/server/datastore/endpoints'
import { tryGetVerifiedAPIProjectWorkspaceID } from '@/src/server/datastore/projects'
import { updateUsage } from '@/src/server/datastore/usage'
import { Endpoint, PromptInputs } from '@/types'
import { loadConfigsFromVersion } from '../runVersion'
import { saveLogEntry } from '@/src/server/datastore/logs'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain, { ChainResponseFromValue } from '@/src/server/evaluationEngine/chainEngine'
import { cacheValueForKey, getCachedValueForKey } from '@/src/server/datastore/cache'
import { withErrorRoute } from '@/src/server/session'
import { EndpointEvent, getClientID, logUnknownUserEvent } from '@/src/server/analytics'
import { updateAnalytics } from '@/src/server/datastore/analytics'
import { DefaultChatContinuationInputKey } from '@/src/common/formatting'
import { detectRequestClosed } from '../cancelRun'
import { SaltValue } from '@/src/common/hashing'

const logResponse = (
  clientID: string,
  endpoint: Endpoint,
  inputs: PromptInputs,
  response: Awaited<ReturnType<typeof runChain>>,
  cacheHit: boolean,
  continuationID: number | undefined
) => {
  const isContinuation = continuationID !== undefined
  updateUsage(
    endpoint.id,
    response.cost,
    response.duration,
    cacheHit,
    isContinuation,
    response.attempts,
    response.failed
  )
  updateAnalytics(
    endpoint.projectID,
    response.cost,
    response.duration,
    cacheHit,
    isContinuation,
    response.attempts,
    response.failed
  )
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
    response.attempts,
    cacheHit,
    continuationID ?? response.continuationID
  )
  logUnknownUserEvent(clientID, EndpointEvent(endpoint.parentID, response.failed, response.cost, response.duration))
}

const getCacheKey = (versionID: number, inputs: PromptInputs) =>
  `${versionID}:${JSON.stringify(Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b)))}`

const cacheResponse = (versionID: number, inputs: PromptInputs, output: string, parentID: number) =>
  cacheValueForKey(getCacheKey(versionID, inputs), output, { versionID, parentID })

const getCachedResponse = (versionID: number, inputs: PromptInputs) =>
  getCachedValueForKey(getCacheKey(versionID, inputs)).then(ChainResponseFromValue)

const stringify = (result: object) => JSON.stringify(result, null, 2)

async function endpoint(req: NextApiRequest, res: NextApiResponse) {
  const { projectID: projectIDFromPath, endpoint: endpointName } = ParseQuery(req.query)
  const projectID = Number(projectIDFromPath)

  if (projectID && endpointName) {
    const apiKey = req.headers['x-api-key'] as string | undefined
    const flavor = req.headers['x-environment'] as string | undefined
    const continuationHeaderKey = 'x-continuation-key'
    const continuationKey = req.headers['x-continuation-key'] as string | undefined

    const verifiedWorkspaceID = apiKey ? await tryGetVerifiedAPIProjectWorkspaceID(apiKey, projectID) : undefined
    if (verifiedWorkspaceID) {
      const endpoint = await getActiveEndpointFromPath(projectID, endpointName, flavor)
      if (endpoint && endpoint.enabled) {
        const clientID = getClientID(req, res)
        const useStreaming = endpoint.useStreaming
        if (useStreaming) {
          res.setHeader('X-Accel-Buffering', 'no')
        } else {
          res.setHeader('Content-Type', 'application/json')
        }

        const salt = (value: number | bigint) => SaltValue(value, endpoint.id)
        const continuationID = continuationKey ? Number(salt(BigInt(continuationKey))) : undefined
        const versionID = endpoint.versionID
        const inputs =
          typeof req.body === 'string' && req.body.length > 0
            ? { [DefaultChatContinuationInputKey]: req.body }
            : (req.body as PromptInputs)

        const cachedResponse = endpoint.useCache && !continuationID ? await getCachedResponse(versionID, inputs) : null
        if (cachedResponse && useStreaming) {
          res.write(cachedResponse.output)
        }
        let response = cachedResponse
        let didReachLastStep = false
        if (!response) {
          const version = await getTrustedVersion(versionID, true)

          const configs = loadConfigsFromVersion(version)
          const stream = useStreaming
            ? (index: number, message: string) => {
                didReachLastStep = index === configs.length - 1
                if (didReachLastStep) {
                  res.write(message)
                }
              }
            : undefined

          const abortController = detectRequestClosed(req)
          response = await runChain(
            endpoint.userID,
            verifiedWorkspaceID,
            projectID,
            version,
            configs,
            inputs,
            true,
            abortController.signal,
            stream,
            continuationID
          )

          if (endpoint.useCache && !response.failed && !continuationID && !response.continuationID) {
            cacheResponse(versionID, inputs, response.output, endpoint.parentID)
          }
        }

        logResponse(clientID, endpoint, inputs, response, !!cachedResponse, continuationID)

        const newContinuationKey = response.continuationID ? salt(response.continuationID).toString() : undefined
        if (useStreaming) {
          if (!didReachLastStep) {
            res.write(response.output)
          }
          if (newContinuationKey && newContinuationKey !== continuationKey) {
            res.write(`\n${continuationHeaderKey}: ${newContinuationKey}`)
          }
          res.end()
          return
        } else {
          return res.send(
            stringify({
              output: response.result,
              ...(newContinuationKey ? { [continuationHeaderKey]: newContinuationKey } : {}),
            })
          )
        }
      }
    }
  }

  return res.status(401).json({ error: 'Invalid URL or API Key' })
}

export default withErrorRoute(endpoint)
