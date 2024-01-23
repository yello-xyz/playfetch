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
import { generateAutoResponse, predictRatingForRun } from '@/src/server/providers/playfetch'
import { TimedRunResponse } from '@/src/server/evaluationEngine/runResponse'

export const loadConfigsFromVersion = (version: RawPromptVersion | RawChainVersion): (RunConfig | CodeConfig)[] =>
  (version.items as (RunConfig | CodeConfig)[] | undefined) ?? [{ versionID: version.id, branch: 0 }]

export const detectRequestClosed = (res: NextApiResponse) => {
  const abortController = new AbortController()
  res.on('close', () => abortController.abort())
  return abortController
}

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
  const multipleDynamicInputs: PromptInputs[] = req.body.dynamicInputs
  const inputIndices = Array.from({ length: multipleInputs.length }, (_, index) => index)
  const continuationIDs = Array.from({ length: multipleInputs.length }, _ => req.body.continuationID)
  const responseContinuationIDs = Array.from({ length: multipleInputs.length }, _ => undefined as number | undefined)
  const indexOffsets = Array.from({ length: multipleInputs.length }, _ => 0)
  const autoRespond = req.body.autoRespond
  const autoRepeatCount = autoRespond !== undefined ? Math.min(10, req.body.maxResponses ?? 0) : 0

  const version = await getTrustedVersion(versionID, true)
  const saveIntermediateRuns = !IsRawPromptVersion(version)
  const parentData = await getVerifiedUserPromptOrChainData(user.id, version.parentID)
  const configs = loadConfigsFromVersion(version)

  res.setHeader('X-Accel-Buffering', 'no')
  const sendData = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)
  const abortController = detectRequestClosed(res)

  for (let autoRunIndex = 0; autoRunIndex < 1 + autoRepeatCount && multipleInputs.length > 0; autoRunIndex++) {
    const runIDs = await allocateRunIDs(multipleInputs.length)
    const lastIndices = multipleInputs.map(_ => 0)

    const sendDataForInput = (
      inputIndex: number,
      message: string | undefined,
      response: TimedRunResponse | undefined,
      userID?: number
    ) =>
      sendData({
        inputIndex: inputIndices[inputIndex],
        index: lastIndices[inputIndex],
        offset: indexOffsets[inputIndex],
        message,
        cost: response?.cost,
        duration: response?.duration,
        failed: response?.failed,
        continuationID: continuationIDs[inputIndex],
        userID,
      })

    const responses = await Promise.all(
      multipleInputs.map(async (inputs, inputIndex) =>
        runChain(
          user.id,
          parentData.projectID,
          version,
          configs,
          inputs,
          false,
          abortController.signal,
          (index, message, response, stepInputs, canLoop) => {
            lastIndices[inputIndex] = index
            sendDataForInput(inputIndex, message, response)
            if (canLoop && response && !response.failed && !response.functionCall) {
              indexOffsets[inputIndex] += lastIndices[inputIndex] + 1
            }
            if (saveIntermediateRuns && response && stepInputs && !response.failed) {
              saveRun(user.id, version, runIDs[inputIndex], index, stepInputs, response, continuationIDs[inputIndex])
            }
          },
          continuationIDs[inputIndex]
        )
      )
    )

    if (abortController.signal.aborted) {
      break
    }

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

    for (let index = responses.length - 1; index >= 0 && autoRunIndex < autoRepeatCount; index--) {
      const response = responses[index]
      const continuationID = response.continuationID
      const functionCall = response.failed ? undefined : response.functionCall
      const inputs = multipleInputs[index]
      const dynamicInputs = multipleDynamicInputs[index]
      const dynamicInput = functionCall ? dynamicInputs[functionCall] : undefined
      let message = undefined
      if (!response.failed && continuationID && functionCall && dynamicInput) {
        if (!continuationIDs[index]) {
          continuationIDs[index] = continuationID
          sendDataForInput(index, undefined, response)
        }
        message = dynamicInput
        if (autoRespond) {
          const autoResponse = await generateAutoResponse(dynamicInput, response.output, responseContinuationIDs[index])
          message = autoResponse[0]
          responseContinuationIDs[index] = autoResponse[1]
        }
        multipleInputs[index] = { ...inputs, [functionCall]: message }
        indexOffsets[index] += 1
        sendDataForInput(index, message, undefined, user.id)
        indexOffsets[index] += lastIndices[index] + 1
      }
      if (!message) {
        multipleInputs.splice(index, 1)
        multipleDynamicInputs.splice(index, 1)
        continuationIDs.splice(index, 1)
        indexOffsets.splice(index, 1)
        inputIndices.splice(index, 1)
        responseContinuationIDs.splice(index, 1)
      }
    }
  }

  res.end()
}

export default withLoggedInUserRoute(runVersion)
