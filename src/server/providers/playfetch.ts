import { PromptInputs, Prompts, RawPromptVersion } from '@/types'
import { getRecentRatingsForParent } from '../datastore/ratings'
import getPredictorForDefaultProviderModel from './vertexai'
import { savePredictedRunRating } from '../datastore/runs'
import { ensurePromptAccess } from '../datastore/prompts'
import { getTrustedVersion, savePromptVersionForUser } from '../datastore/versions'

type Rating = Awaited<ReturnType<typeof getRecentRatingsForParent>>[0]

const buildRatingPredictionPrompts = (recentRatings: Rating[], inputs: PromptInputs, output: string) => ({
  system: 'You are a critical QA tester who is concise and predictable',
  main: `Given the following ratings for outputs based on inputs, predict the rating for the next output based on its input. Limit yourself to the same ratings and reasons as the ones provided in the examples:

${recentRatings
  .map(
    rating =>
      `Input: ${rating.inputs}
Output: ${rating.output}
Rating: ${rating.rating}
Reason: ${rating.reason}

`
  )
  .join('')})}

Inputs: ${inputs}
Output: ${output}
Rating: `,
})

enum Endpoint {
  Respond = '/respond',
  Suggest = '/suggest',
}

const continuationKey = 'x-continuation-key'

const postRequest = async (endpoint: Endpoint, inputs: PromptInputs, continuationID?: number) => {
  const response = await fetch(`${process.env.PLAYFETCH_ENDPOINT_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.PLAYFETCH_API_KEY ?? '',
      ...(continuationID ? { [continuationKey]: continuationID.toString() } : {}),
    },
    body: JSON.stringify(inputs),
  }).then(response => response.json())

  const output = response?.output ?? ''
  continuationID = response?.[continuationKey] ? Number(response[continuationKey]) : undefined

  return [output, continuationID] as const
}

const runPrompt = (prompts: Prompts, temperature = 0) =>
  getPredictorForDefaultProviderModel('chat-bison')(
    prompts,
    temperature,
    500,
    {},
    false,
    undefined,
    undefined,
    undefined,
    {}
  ).then(response => ('output' in response && !!response.output ? response.output : null))

export const generateAutoResponse = (system: string, message: string, continuationID?: number) =>
  postRequest(Endpoint.Respond, { system, message }, continuationID)

export async function predictRatingForRun(runID: number, parentID: number, inputs: PromptInputs, output: string) {
  const recentRatings = await getRecentRatingsForParent(parentID)

  if (recentRatings.length > 0) {
    const response = await runPrompt(buildRatingPredictionPrompts(recentRatings, inputs, output))
    if (response) {
      const lines = response
        .split('\n')
        .map(line =>
          line
            .replace(/Rating:/gi, '')
            .replace(/Reason:/gi, '')
            .trim()
        )
        .filter(line => line.length > 0)
      if (lines.length === 2) {
        const [rating, reason] = lines
        if (rating === 'positive' || rating === 'negative') {
          await savePredictedRunRating(runID, rating, reason)
        }
      }
    }
  }
}

export async function suggestImprovementForPrompt(userID: number, promptID: number, versionID: number) {
  await ensurePromptAccess(userID, promptID)
  const recentRatings = await getRecentRatingsForParent(promptID)
  const promptVersion = (await getTrustedVersion(versionID)) as RawPromptVersion

  const [response] = await postRequest(Endpoint.Suggest, {
    recentRatings: JSON.stringify(recentRatings),
    prompt: promptVersion.prompts.main,
  })

  if (response) {
    await savePromptVersionForUser(
      userID,
      promptID,
      { ...promptVersion.prompts, main: response },
      promptVersion.config,
      versionID,
      versionID
    )
  }
}
