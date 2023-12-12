import { PromptInputs, RawPromptVersion } from '@/types'
import { getRecentRatingsForParent } from '../datastore/ratings'
import { savePredictedRunRating } from '../datastore/runs'
import { ensurePromptAccess } from '../datastore/prompts'
import { getTrustedVersion, savePromptVersionForUser } from '../datastore/versions'

enum Endpoint {
  Respond = '/respond',
  Rate = '/rate',
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

export const generateAutoResponse = (system: string, message: string, continuationID?: number) =>
  postRequest(Endpoint.Respond, { system, message }, continuationID)

export async function predictRatingForRun(runID: number, parentID: number, inputs: PromptInputs, output: string) {
  const recentRatings = await getRecentRatingsForParent(parentID)

  if (recentRatings.length > 0) {
    const [response] = await postRequest(Endpoint.Rate, {
      recentRatings: JSON.stringify(recentRatings),
      inputs: JSON.stringify(inputs),
      output,
    })
  
    if (response?.rating && response?.reason) {
      await savePredictedRunRating(runID, response.rating, response.reason)
    }  
  }
}

export async function suggestImprovementForPrompt(
  userID: number,
  promptID: number,
  versionID: number,
  currentVersionID: number
) {
  await ensurePromptAccess(userID, promptID)
  const recentRatings = await getRecentRatingsForParent(promptID)
  const promptVersion = (await getTrustedVersion(versionID)) as RawPromptVersion

  const [response] = await postRequest(Endpoint.Suggest, {
    recentRatings: JSON.stringify(recentRatings),
    prompt: promptVersion.prompts.main,
  })

  if (response && typeof response === 'string') {
    await savePromptVersionForUser(
      userID,
      promptID,
      { ...promptVersion.prompts, main: response },
      promptVersion.config,
      currentVersionID,
      versionID
    )
  }
}
