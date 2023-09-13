import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain, { MaxContinuationCount } from '@/src/server/chainEngine'
import logUserEvent, { RunEvent } from '@/src/server/analytics'

export const loadConfigsFromVersion = (version: RawPromptVersion | RawChainVersion): (RunConfig | CodeConfig)[] =>
  version.items ?? [{ versionID: version.id }]

const logResponse = (
  req: NextApiRequest,
  res: NextApiResponse,
  userID: number,
  version: RawPromptVersion | RawChainVersion,
  inputs: PromptInputs,
  response: Awaited<ReturnType<typeof runChain>> & { output: string }
) => {
  saveRun(
    userID,
    version.parentID,
    version.id,
    inputs,
    response.output,
    new Date(),
    response.cost,
    response.duration,
    []
  )
  logUserEvent(req, res, userID, RunEvent(version.parentID, response.failed, response.cost, response.duration))
}

const timestampIf = (condition: boolean) => (condition ? new Date().toISOString() : undefined)

async function runVersion(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const multipleInputs: PromptInputs[] = req.body.inputs

  const version = await getTrustedVersion(versionID, true)
  const configs = loadConfigsFromVersion(version)

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  await Promise.all(
    multipleInputs.map(async (inputs, inputIndex) => {
      const offset = (index: number) => inputIndex * (configs.length * MaxContinuationCount) + index
      return runChain(user.id, version, configs, inputs, false, (index, message, cost, duration, failed) =>
        sendData({
          index: offset(index),
          message,
          timestamp: timestampIf(failed !== undefined),
          cost,
          duration,
          failed,
        })
      ).then(response => {
        if (!response.failed) {
          sendData({ index: offset(configs.length - 1 + response.extraSteps) })
          logResponse(req, res, user.id, version, inputs, response)
        }
      })
    })
  )

  res.end()
}

export default withLoggedInUserRoute(runVersion)
