import { PromptInputs, Run, RunRating } from '@/types'
import { Entity, allocateIDs, buildKey, getDatastore, getID, getKeyedEntity, getRecentEntities, getTimestamp } from './datastore'
import { processLabels } from './versions'
import { ensurePromptOrChainAccess } from './chains'
import { saveComment } from './comments'

export async function migrateRuns(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  let remainingSaveCount = 100
  const [allRuns] = await datastore.runQuery(datastore.createQuery(Entity.RUN))
  for (const runData of allRuns) {
    if (runData.inputTokens !== undefined) {
      continue
    }
    if (remainingSaveCount-- <= 0) {
      console.log(`‼️  Please run this migration again to process remaining runs (total count ${allRuns.length})`)
      return
    }
    await datastore.save(
      toRunData(
        runData.userID,
        runData.parentID,
        runData.versionID,
        JSON.parse(runData.inputs),
        runData.output,
        runData.createdAt,
        runData.cost,
        runData.inputTokens ?? 0,
        runData.outputTokens ?? 0,
        runData.duration,
        JSON.parse(runData.labels),
        runData.rating ?? null,
        runData.continuationID ?? null,
        runData.canContinue ?? false,
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
    inputs,
    output,
    new Date(),
    cost,
    inputTokens,
    outputTokens,
    duration,
    [],
    null,
    continuationID,
    canContinue,
    runID
  )
  await getDatastore().save(runData)
}

const getVerifiedUserRunData = async (userID: number, runID: number) => {
  const runData = await getKeyedEntity(Entity.RUN, runID)
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
  replyTo?: number
) {
  const runData = await getVerifiedUserRunData(userID, runID)
  await saveComment(
    userID,
    projectID,
    runData.parentID,
    runData.versionID,
    '', // TODO store the justification here (maybe)
    replyTo,
    rating === 'positive' ? 'thumbsUp' : 'thumbsDown',
    runID
  )
  if (rating !== runData.rating) {
    await updateRun({ ...runData, rating })
  }
}

async function updateRun(runData: any) {
  await getDatastore().save(
    toRunData(
      runData.userID,
      runData.parentID,
      runData.versionID,
      JSON.parse(runData.inputs),
      runData.output,
      runData.createdAt,
      runData.cost,
      runData.inputTokens,
      runData.outputTokens,
      runData.duration,
      JSON.parse(runData.labels),
      runData.rating,
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
  inputs: PromptInputs,
  output: string,
  createdAt: Date,
  cost: number,
  inputTokens: number,
  outputTokens: number,
  duration: number,
  labels: string[],
  rating: RunRating | null,
  continuationID: number | null,
  canContinue: boolean,
  runID?: number
) => ({
  key: buildKey(Entity.RUN, runID),
  data: {
    userID,
    parentID,
    versionID,
    inputs: JSON.stringify(inputs),
    output,
    createdAt,
    cost,
    inputTokens,
    outputTokens,
    duration,
    labels: JSON.stringify(labels),
    rating,
    continuationID,
    canContinue,
  },
  excludeFromIndexes: ['output', 'inputs', 'labels'],
})

export const toRun = (data: any): Run => ({
  id: getID(data),
  userID: data.userID,
  timestamp: getTimestamp(data),
  inputs: JSON.parse(data.inputs),
  output: data.output,
  cost: data.cost,
  tokens: data.inputTokens + data.outputTokens,
  duration: data.duration,
  labels: JSON.parse(data.labels),
  rating: data.rating,
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
  return recentRunsData.map(runData => ({ ...toRun(runData), userID: runData.userID }))
}
