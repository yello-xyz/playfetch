import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain from '@/src/server/evaluationEngine/chainEngine'
import logUserRequest, { RunEvent } from '@/src/server/analytics'

export const loadConfigsFromVersion = (version: RawPromptVersion | RawChainVersion): (RunConfig | CodeConfig)[] =>
  (version.items as (RunConfig | CodeConfig)[] | undefined) ?? [{ versionID: version.id, branch: 0 }]

const logResponse = (
  req: NextApiRequest,
  res: NextApiResponse,
  userID: number,
  version: RawPromptVersion | RawChainVersion,
  inputs: PromptInputs,
  response: Awaited<ReturnType<typeof runChain>>,
  continuationID: number | undefined
) => {
  logUserRequest(req, res, userID, RunEvent(version.parentID, response.failed, response.cost, response.duration))
  return response.failed
    ? Promise.resolve()
    : saveRun(
        userID,
        version.parentID,
        version.id,
        inputs,
        response.output,
        response.cost,
        response.duration,
        [],
        continuationID ?? response.continuationID,
        !!response.continuationID
      )
}

async function runVersion(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const multipleInputs: PromptInputs[] = req.body.inputs
  const continuationID = req.body.continuationID

  const version = await getTrustedVersion(versionID, true)
  const configs = loadConfigsFromVersion(version)

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  const responses = await Promise.all(
    multipleInputs.map(async (inputs, inputIndex) => {
      return runChain(
        user.id,
        version,
        configs,
        inputs,
        false,
        (index, extraSteps, message, cost, duration, failed) =>
          sendData({
            inputIndex,
            configIndex: index,
            index: index + extraSteps,
            message,
            cost,
            duration,
            failed,
            continuationID,
          }),
        continuationID
      )
    })
  )

  for (const [index, response] of responses.entries()) {
    sendData({
      inputIndex: index,
      timestamp: new Date().getTime(),
      isLast: !response.failed,
      continuationID: response.continuationID,
    })
    await logResponse(req, res, user.id, version, multipleInputs[index], response, continuationID)
  }

  res.end()
}

export default withLoggedInUserRoute(runVersion)
