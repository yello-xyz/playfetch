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

  let totalCost = 0
  let totalDuration = 0
  const updateChainVersion = version.items
    ? (index: number, inputs: PromptInputs, output: string, cost: number, duration: number) => {
        totalCost += cost
        totalDuration += duration
        if (index === configs.length - 1) {
          saveRun(user.id, version.parentID, version.id, inputs, output, new Date(), totalCost, totalDuration, [])
        }
      }
    : undefined

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  await Promise.all(
    multipleInputs.map((inputs, inputIndex) => {
      const offset = (index: number) => inputIndex * configs.length + index
      return runChain(
        user.id,
        version,
        configs,
        inputs,
        false,
        false,
        // TODO the appropriate inputs for the specific run should be passed in here as well.
        // TODO no need to persist individual prompt runs when evaluating a chain version?
        (index, version, { output, cost, duration, failed }) => {
          const createdAt = new Date()
          sendData({ index: offset(index), timestamp: createdAt.toISOString(), cost, duration, failed })
          if (updateChainVersion && output && !failed) {
            updateChainVersion(index, inputs, output, cost, duration)
          }
          return version && output && !failed
            ? saveRun(user.id, version.parentID, version.id, inputs, output, createdAt, cost, duration, [])
            : Promise.resolve({})
        },
        (index, message) => sendData({ index: offset(index), message })
      )
    })
  )

  res.end()
}

export default withLoggedInUserRoute(runVersion)
