import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { allocateRunIDs, saveNewRun } from '@/src/server/datastore/runs'
import { PromptInputs, User, RunConfig, CodeConfig, RawPromptVersion, RawChainVersion } from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain from '@/src/server/evaluationEngine/chainEngine'
import logUserRequest, { RunEvent } from '@/src/server/analytics'
import { getVerifiedUserPromptOrChainData } from '@/src/server/datastore/chains'

export const loadConfigsFromVersion = (version: RawPromptVersion | RawChainVersion): (RunConfig | CodeConfig)[] =>
  (version.items as (RunConfig | CodeConfig)[] | undefined) ?? [{ versionID: version.id, branch: 0 }]

const saveRun = (
  userID: number,
  version: RawPromptVersion | RawChainVersion,
  parentRunID: number | null,
  itemIndex: number,
  inputs: PromptInputs,
  response: Awaited<ReturnType<typeof runChain>> & { failed: false },
  continuationID: number | undefined,
  runID?: number
) =>
  saveNewRun(
    userID,
    version.parentID,
    version.id,
    parentRunID,
    itemIndex,
    inputs,
    response.output,
    response.cost,
    response.inputTokens,
    response.outputTokens,
    response.duration,
    continuationID ?? response.continuationID ?? null,
    !!response.continuationID,
    runID
  )

async function runVersion(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const multipleInputs: PromptInputs[] = req.body.inputs
  const continuationID = req.body.continuationID

  const version = await getTrustedVersion(versionID, true)
  const parentData = await getVerifiedUserPromptOrChainData(user.id, version.parentID)
  const configs = loadConfigsFromVersion(version)

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  const runIDs = await allocateRunIDs(multipleInputs.length)
  const lastIndices = multipleInputs.map(_ => 0)

  const responses = await Promise.all(
    multipleInputs.map(async (inputs, inputIndex) => {
      return runChain(
        user.id,
        parentData.projectID,
        version,
        configs,
        inputs,
        false,
        (index, message, response, stepInputs) => {
          sendData({
            inputIndex,
            index,
            message,
            cost: response?.cost,
            duration: response?.duration,
            failed: response?.failed,
            continuationID,
          })
          lastIndices[inputIndex] = index
          if (response && stepInputs && !response.failed && !response.functionCall && index < configs.length - 1) {
            saveRun(user.id, version, runIDs[inputIndex], index, stepInputs, response, continuationID)
          }
        },
        continuationID
      )
    })
  )

  for (const [index, response] of responses.entries()) {
    logUserRequest(req, res, user.id, RunEvent(version.parentID, response.failed, response.cost, response.duration))
    if (!response.failed) {
      await saveRun(
        user.id,
        version,
        null,
        lastIndices[index],
        multipleInputs[index],
        response,
        continuationID,
        runIDs[index]
      )
    }
  }

  res.end()
}

export default withLoggedInUserRoute(runVersion)
