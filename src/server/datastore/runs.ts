import { PromptInputs, Run, RunRating } from '@/types'
import {
  Entity,
  allocateIDs,
  buildFilter,
  buildKey,
  getDatastore,
  getFilteredEntities,
  getFilteredOrderedEntities,
  getID,
  getKeyedEntities,
  getKeyedEntity,
  getRecentEntities,
  getTimestamp,
} from './datastore'
import { processLabels } from './versions'
import { ensurePromptOrChainAccess } from './chains'
import { saveComment } from './comments'
import { PropertyFilter, and, or } from '@google-cloud/datastore'
import { saveRunRatingForParent } from './ratings'

export async function migrateRuns(postMerge: boolean) {
  if (postMerge) {
    const datastore = getDatastore()
    const [intermediateRuns] = await datastore.runQuery(
      datastore.createQuery(Entity.RUN).filter(new PropertyFilter('parentRunID', '!=', null))
    )
    const versionIDs = [...new Set(intermediateRuns.map(runData => runData.versionID))]
    const versionsData = await getKeyedEntities(Entity.VERSION, versionIDs)
    const promptVersionIDs = new Set(
      versionsData.filter(versionData => versionData.items === null).map(versionData => getID(versionData))
    )
    const intermediatePromptRuns = intermediateRuns.filter(runData => promptVersionIDs.has(runData.versionID))
    await datastore.delete(intermediatePromptRuns.map(runData => buildKey(Entity.RUN, getID(runData))))
    console.log(
      `Deleted ${intermediatePromptRuns.length} intermediate prompt runs`,
      intermediatePromptRuns.map(runData => getID(runData))
    )
  }

  return

  const datastore = getDatastore()
  let remainingSaveCount = 100
  const [allRuns] = await datastore.runQuery(datastore.createQuery(Entity.RUN))
  for (const runData of allRuns) {
    if (remainingSaveCount-- <= 0) {
      console.log(`‼️  Please run this migration again to process remaining runs (total count ${allRuns.length})`)
      return
    }
    await datastore.save(
      toRunData(
        runData.userID,
        runData.parentID,
        runData.versionID,
        runData.parentRunID,
        runData.itemIndex,
        JSON.parse(runData.inputs),
        runData.output,
        runData.createdAt,
        runData.cost,
        runData.inputTokens,
        runData.outputTokens,
        runData.duration,
        JSON.parse(runData.labels),
        runData.rating,
        runData.reason,
        runData.continuationID,
        runData.canContinue,
        getID(runData)
      )
    )
  }
  console.log('✅ Processed all remaining runs')
}

export const allocateRunIDs = (count: number) => allocateIDs(Entity.RUN, count)

export async function saveNewRun(
  userID: number,
  parentID: number,
  versionID: number,
  parentRunID: number | null,
  itemIndex: number,
  inputs: PromptInputs,
  output: string,
  cost: number,
  inputTokens: number,
  outputTokens: number,
  duration: number,
  continuationID: number | null,
  canContinue: boolean,
  runID?: number
) {
  const runData = toRunData(
    userID,
    parentID,
    versionID,
    parentRunID,
    itemIndex,
    inputs,
    output,
    new Date(),
    cost,
    inputTokens,
    outputTokens,
    duration,
    [],
    null,
    null,
    continuationID,
    canContinue,
    runID
  )
  await getDatastore().save(runData)
}

export async function getIntermediateRunsForParentRun(userID: number, parentRunID: number, continuationID?: number) {
  const runData = await getFilteredEntities(
    Entity.RUN,
    continuationID
      ? or([
          buildFilter('parentRunID', parentRunID),
          and([buildFilter('continuationID', continuationID), new PropertyFilter('parentRunID', '!=', null)]),
        ])
      : buildFilter('parentRunID', parentRunID)
  )
  if (runData.length > 0) {
    await ensurePromptOrChainAccess(userID, runData[0].parentID)
  }
  return runData.map(toRun(0))
}

export const getOrderedRunsForParentID = (parentID: number) =>
  getFilteredOrderedEntities(Entity.RUN, and([buildFilter('parentID', parentID), buildFilter('parentRunID', null)]))

const getTrustedRunData = (runID: number) => getKeyedEntity(Entity.RUN, runID)

const getVerifiedUserRunData = async (userID: number, runID: number) => {
  const runData = await getTrustedRunData(runID)
  if (!runData) {
    throw new Error(`Run with ID ${runID} does not exist or user has no access`)
  }
  await ensurePromptOrChainAccess(userID, runData.parentID)
  return runData
}

export async function updateRunLabel(
  userID: number,
  runID: number,
  projectID: number,
  label: string,
  checked: boolean,
  replyTo?: number
) {
  const runData = await getVerifiedUserRunData(userID, runID)
  const labels = JSON.parse(runData.labels) as string[]
  const newLabels = await processLabels(
    labels,
    userID,
    runData.versionID,
    runData.parentID,
    projectID,
    label,
    checked,
    replyTo,
    runID
  )
  if (newLabels) {
    await updateRun({ ...runData, labels: JSON.stringify(newLabels) })
  }
}

export async function updateRunRating(
  userID: number,
  runID: number,
  projectID: number,
  rating: RunRating,
  reason?: string,
  replyTo?: number
) {
  const runData = await getVerifiedUserRunData(userID, runID)
  await saveComment(
    userID,
    projectID,
    runData.parentID,
    runData.versionID,
    reason ?? '',
    replyTo,
    rating === 'positive' ? 'thumbsUp' : 'thumbsDown',
    runID
  )
  if (rating !== runData.rating || !!reason) {
    await updateRun({ ...runData, rating, reason: reason ?? null })
  }
  if (!!reason && reason !== runData.reason) {
    saveRunRatingForParent(runData.parentID, JSON.parse(runData.inputs), runData.output, rating, reason)
  }
}

const predictedRatingPrefix = 'predicted-'

export async function savePredictedRunRating(runID: number, rating: RunRating, reason: string) {
  const runData = await getTrustedRunData(runID)
  if (runData.rating === null) {
    await updateRun({ ...runData, rating: `${predictedRatingPrefix}${rating}`, reason })
  }
}

async function updateRun(runData: any) {
  await getDatastore().save(
    toRunData(
      runData.userID,
      runData.parentID,
      runData.versionID,
      runData.parentRunID,
      runData.itemIndex,
      JSON.parse(runData.inputs),
      runData.output,
      runData.createdAt,
      runData.cost,
      runData.inputTokens,
      runData.outputTokens,
      runData.duration,
      JSON.parse(runData.labels),
      runData.rating,
      runData.reason,
      runData.continuationID,
      runData.canContinue,
      getID(runData)
    )
  )
}

const toRunData = (
  userID: number,
  parentID: number,
  versionID: number,
  parentRunID: number | null,
  itemIndex: number,
  inputs: PromptInputs,
  output: string,
  createdAt: Date,
  cost: number,
  inputTokens: number,
  outputTokens: number,
  duration: number,
  labels: string[],
  rating: RunRating | 'predicted-positive' | 'predicted-negative' | null,
  reason: string | null,
  continuationID: number | null,
  canContinue: boolean,
  runID?: number
) => ({
  key: buildKey(Entity.RUN, runID),
  data: {
    userID,
    parentID,
    versionID,
    parentRunID,
    itemIndex,
    inputs: JSON.stringify(inputs),
    output,
    createdAt,
    cost,
    inputTokens,
    outputTokens,
    duration,
    labels: JSON.stringify(labels),
    rating,
    reason,
    continuationID,
    canContinue,
  },
  excludeFromIndexes: ['output', 'inputs', 'labels', 'reason'],
})

export const toRun =
  (maxItemIndex: number) =>
  (data: any): Run => ({
    id: getID(data),
    index: data.itemIndex !== null ? data.itemIndex : maxItemIndex,
    parentRunID: data.parentRunID,
    userID: data.userID,
    timestamp: getTimestamp(data),
    inputs: JSON.parse(data.inputs),
    output: data.output,
    cost: data.cost,
    tokens: data.inputTokens + data.outputTokens,
    duration: data.duration,
    labels: JSON.parse(data.labels),
    rating: data.rating !== null ? data.rating.replace(predictedRatingPrefix, '') : null,
    isPredictedRating: data.rating !== null && data.rating.startsWith(predictedRatingPrefix),
    reason: data.reason,
    continuationID: data.continuationID,
    canContinue: data.canContinue,
  })

export async function getRecentRuns(
  since: Date,
  before: Date | undefined,
  limit: number,
  pagingBackwards = false
): Promise<(Run & { userID: number })[]> {
  const recentRunsData = await getRecentEntities(Entity.RUN, limit, since, before, 'createdAt', pagingBackwards)
  return recentRunsData.map(runData => ({ ...toRun(0)(runData), userID: runData.userID }))
}
