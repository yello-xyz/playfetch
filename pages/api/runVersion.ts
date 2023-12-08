import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { allocateRunIDs, saveNewRun } from '@/src/server/datastore/runs'
import {
  PromptInputs,
  User,
  RunConfig,
  CodeConfig,
  RawPromptVersion,
  RawChainVersion,
  IsRawPromptVersion,
} from '@/types'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import runChain from '@/src/server/evaluationEngine/chainEngine'
import logUserRequest, { RunEvent } from '@/src/server/analytics'
import { getVerifiedUserPromptOrChainData } from '@/src/server/datastore/chains'
import { predictRatingForRun } from '@/src/server/prediction'

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
  const continuationIDs = Array.from({ length: multipleInputs.length }, _ => req.body.continuationID) 
  const autoRespond = req.body.autoRespond
  const autoRepeatCount = autoRespond !== undefined ? Math.min(0, req.body.maxResponses ?? 0) : 0

  const version = await getTrustedVersion(versionID, true)
  const saveIntermediateRuns = !IsRawPromptVersion(version)
  const parentData = await getVerifiedUserPromptOrChainData(user.id, version.parentID)
  const configs = loadConfigsFromVersion(version)

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  for (let autoRunIndex = 0; autoRunIndex < 1 + autoRepeatCount; autoRunIndex++) {
    const runIDs = await allocateRunIDs(multipleInputs.length)
    const lastIndices = multipleInputs.map(_ => 0)

    const responses = await Promise.all(
      multipleInputs.map(async (inputs, inputIndex) =>
        runChain(
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
              continuationID: continuationIDs[inputIndex],
            })
            lastIndices[inputIndex] = index
            if (saveIntermediateRuns && response && stepInputs && !response.failed) {
              saveRun(user.id, version, runIDs[inputIndex], index, stepInputs, response, continuationIDs[inputIndex])
            }
          },
          continuationIDs[inputIndex]
        )
      )
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
          continuationIDs[index],
          runIDs[index]
        )
        predictRatingForRun(runIDs[index], version.parentID, multipleInputs[index], response.output)
      }
    }

    if (responses.some(response => response.failed)) {
      break
    } else {
      for (const [index, response] of responses.entries()) {
        continuationIDs[index] = response.continuationID
      }
    }
  }

  res.end()
}

export default withLoggedInUserRoute(runVersion)
