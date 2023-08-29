import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain from '@/src/server/chainEngine'

export const loadConfigsFromVersion = (version: RawPromptVersion | RawChainVersion): (RunConfig | CodeConfig)[] =>
  version.items ?? [{ versionID: version.id }]

const logResponse =
  (userID: number, version: RawPromptVersion | RawChainVersion, inputs: PromptInputs) =>
  (response: Awaited<ReturnType<typeof runChain>>) => {
    if (!response.failed) {
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
    }
  }

async function runVersion(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const multipleInputs: PromptInputs[] = req.body.inputs

  const version = await getTrustedVersion(versionID)
  const configs = loadConfigsFromVersion(version)

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  await Promise.all(
    multipleInputs.map(async (inputs, inputIndex) => {
      const offset = (index: number) => inputIndex * configs.length + index
      const timestamp = (failed?: boolean) => (failed !== undefined ? new Date().toISOString() : undefined)
      return runChain(user.id, version, configs, inputs, false, (index, message, cost, duration, failed) =>
        sendData({ index: offset(index), message, timestamp: timestamp(failed), cost, duration, failed })
      ).then(logResponse(user.id, version, inputs))
    })
  )

  res.end()
}

export default withLoggedInUserRoute(runVersion)
