import { PromptInputs } from '@/types'
import { getRecentRatingsForParent } from './datastore/ratings'
import ModelProvider from './providers/vertexai'
import { savePredictedRunRating } from './datastore/runs'

type Rating = Awaited<ReturnType<typeof getRecentRatingsForParent>>[0]

const buildRatingPredictionPrompts = (recentRatings: Rating[], inputs: PromptInputs, output: string) => ({
  system: 'You are a critical QA tester who is concise and predictable.',
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

export async function predictRatingForRun(runID: number, parentID: number, inputs: PromptInputs, output: string) {
  const recentRatings = await getRecentRatingsForParent(parentID)

  const response = await ModelProvider('chat-bison')(
    buildRatingPredictionPrompts(recentRatings, inputs, output),
    0,
    500,
    {},
    false,
    undefined,
    undefined,
    undefined,
    {}
  )

  if ('output' in response && !!output) {
    const lines = response.output
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
