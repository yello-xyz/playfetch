import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { saveRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain from '@/src/server/chainEngine'

export const loadConfigsFromVersion = (version: RawPromptVersion | RawChainVersion): (RunConfig | CodeConfig)[] =>
  version.items ?? [{ versionID: version.id }]

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
      const response = await runChain(
        user.id,
        version,
        configs,
        inputs,
        false,
        false,
        (index, message) => sendData({ index: offset(index), message }),
        (index, cost, duration, failed) =>
          sendData({ index: offset(index), timestamp: new Date().toISOString(), cost, duration, failed })
      )

      if (!response.failed) {
        saveRun(
          user.id,
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
    })
  )

  res.end()
}

export default withLoggedInUserRoute(runVersion)
