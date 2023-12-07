import { PromptInputs, Prompts, RawPromptVersion } from '@/types'
import { getRecentRatingsForParent } from './datastore/ratings'
import getPredictorForDefaultProviderModel from './providers/vertexai'
import { savePredictedRunRating } from './datastore/runs'
import { ensurePromptAccess } from './datastore/prompts'
import { getTrustedVersion, savePromptVersionForUser } from './datastore/versions'

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

const buildPromptImprovementPrompts = (recentRatings: Rating[], prompts: Prompts) => ({
  system: 'You are a linguist expert',
  main: `Given the following prompt and ratings for outputs based on inputs, suggest a better prompt that would produce better outputs:

Prompt: ${prompts.main}

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

Suggested prompt: `,
})

const runPrompt = (prompts: Prompts) =>
  getPredictorForDefaultProviderModel('chat-bison')(
    prompts,
    0,
    500,
    {},
    false,
    undefined,
    undefined,
    undefined,
    {}
  ).then(response => ('output' in response && !!response.output ? response.output : null))

export async function predictRatingForRun(runID: number, parentID: number, inputs: PromptInputs, output: string) {
  const recentRatings = await getRecentRatingsForParent(parentID)

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

export async function suggestImprovementForPrompt(userID: number, promptID: number, versionID: number) {
  await ensurePromptAccess(userID, promptID)
  const recentRatings = await getRecentRatingsForParent(promptID)
  const promptVersion = (await getTrustedVersion(versionID)) as RawPromptVersion
  const prompts = promptVersion.prompts

  const response = await runPrompt(buildPromptImprovementPrompts(recentRatings, promptVersion.prompts))

  if (response) {
    await savePromptVersionForUser(
      userID,
      promptID,
      { ...prompts, main: response },
      promptVersion.config,
      versionID,
      versionID
    )
  }
}
