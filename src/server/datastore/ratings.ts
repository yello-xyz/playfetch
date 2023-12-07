import { PromptInputs, RunRating } from '@/types'
import {
  Entity,
  buildKey,
  getDatastore,
  getID,
  getKeyedEntity,
  runTransactionWithExponentialBackoff,
} from './datastore'
import { PropertyFilter } from '@google-cloud/datastore'

export async function migrateRatings(postMerge: boolean) {
  const datastore = getDatastore()
  const [allRatings] = await datastore.runQuery(datastore.createQuery(Entity.RATING))

  if (postMerge && allRatings.length === 0) {
    const [ratedRuns] = await datastore.runQuery(
      datastore.createQuery(Entity.RUN).filter(new PropertyFilter('rating', '!=', null))
    )
    const filteredRuns = ratedRuns
      .filter(runData => !!runData.reason && runData.parentRunID === null)
      .sort((a, b) => a.createdAt - b.createdAt)
    console.log(`Migrating ${filteredRuns.length} out of ${ratedRuns.length} runs to ratings`)
    for (const runData of filteredRuns) {
      await saveRunRatingForParent(
        runData.parentID,
        JSON.parse(runData.inputs),
        runData.output,
        runData.rating,
        runData.reason
      )
    }
  }

  return

  for (const ratingData of allRatings) {
    await getDatastore().save(
      toRatingData(getID(ratingData), ratingData.createdAt, JSON.parse(ratingData.recentRatings))
    )
  }
}

const RecentRatingCutoffLength = 10
const MinimumRecentRatingLength = 10

type Rating = {
  inputs: PromptInputs
  output: string
  rating: RunRating
  reason: string
}

export const getRecentRatingsForParent = async (parentID: number) => {
  const ratingData = await getKeyedEntity(Entity.RATING, parentID)
  const recentRatings = ratingData ? (JSON.parse(ratingData.recentRatings) as Rating[]) : []
  return recentRatings.length < MinimumRecentRatingLength ? [] : recentRatings
}

export const saveRunRatingForParent = async (
  parentID: number,
  inputs: PromptInputs,
  output: string,
  rating: RunRating,
  reason: string
) => {
  await runTransactionWithExponentialBackoff(async transaction => {
    const ratingData = await getKeyedEntity(Entity.RATING, parentID, transaction)
    const recentRatings = [
      { inputs, output, rating, reason },
      ...(ratingData ? (JSON.parse(ratingData.recentRatings) as Rating[]) : []),
    ].slice(0, RecentRatingCutoffLength)
    transaction.save(toRatingData(parentID, new Date(), recentRatings))
  })
}

const toRatingData = (parentID: number, createdAt: Date, recentRatings: Rating[]) => ({
  key: buildKey(Entity.RATING, parentID),
  data: { createdAt, recentRatings: JSON.stringify(recentRatings) },
  excludeFromIndexes: ['recentRatings'],
})
