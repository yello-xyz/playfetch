import { PromptInputs, Run } from '@/types'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity, getRecentEntities, getTimestamp } from './datastore'
import { processLabels } from './versions'
import { ensurePromptOrChainAccess } from './chains'

export async function migrateRuns(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  let remainingSaveCount = 100
  const [allRuns] = await datastore.runQuery(datastore.createQuery(Entity.RUN))
  for (const runData of allRuns) {
    if (remainingSaveCount-- <= 0) {
      console.log('‼️  Please run this migration again to process remaining runs')
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
        runData.duration,
        JSON.parse(runData.labels),
        runData.continuationID,
        runData.canContinue,
        getID(runData)
      )
    )
  }
  console.log('✅ Processed all remaining runs')
}

export async function saveRun(
  userID: number,
  parentID: number,
  versionID: number,
  inputs: PromptInputs,
  output: string,
  cost: number,
  duration: number,
  labels: string[],
  continuationID: number | undefined,
  canContinue: boolean
) {
  await ensurePromptOrChainAccess(userID, parentID)
  const runData = toRunData(
    userID,
    parentID,
    versionID,
    inputs,
    output,
    new Date(),
    cost,
    duration,
    labels,
    continuationID,
    canContinue ?? undefined
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
      runData.duration,
      JSON.parse(runData.labels),
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
  duration: number,
  labels: string[],
  continuationID: number | undefined,
  canContinue: boolean | undefined,
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
    duration,
    labels: JSON.stringify(labels),
    continuationID: continuationID ?? null,
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
  duration: data.duration,
  labels: JSON.parse(data.labels),
  continuationID: data.continuationID ?? null,
  canContinue: data.canContinue ?? false,
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
