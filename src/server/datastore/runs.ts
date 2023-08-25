import { PromptInputs, Run } from '@/types'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity, getTimestamp } from './datastore'
import { processLabels } from './versions'
import { ensurePromptOrChainAccess } from './chains'

export async function migrateRuns(postMerge: boolean) {
  const datastore = getDatastore()
  const [allRuns] = await datastore.runQuery(datastore.createQuery(Entity.RUN))
  for (const runData of allRuns) {
    await datastore.save(
      toRunData(
        runData.parentID ?? runData.promptID,
        runData.versionID,
        JSON.parse(runData.inputs),
        runData.output,
        runData.createdAt,
        runData.cost,
        runData.duration,
        JSON.parse(runData.labels),
        getID(runData),
        postMerge && runData.parentID ? undefined : runData.promptID
      )
    )
  }
}

export async function saveRun(
  userID: number,
  parentID: number,
  versionID: number,
  inputs: PromptInputs,
  output: string,
  createdAt: Date,
  cost: number,
  duration: number,
  labels: string[]
): Promise<Run> {
  await ensurePromptOrChainAccess(userID, parentID)
  const runData = toRunData(parentID, versionID, inputs, output, createdAt, cost, duration, labels)
  await getDatastore().save(runData)
  return {
    id: getID(runData),
    timestamp: getTimestamp(runData.data),
    inputs,
    output,
    cost,
    duration,
    labels,
  }
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
  checked: boolean
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
    runID
  )
  if (newLabels) {
    await updateRun({ ...runData, labels: JSON.stringify(newLabels) })
  }
}

async function updateRun(runData: any) {
  await getDatastore().save(
    toRunData(
      runData.parentID,
      runData.versionID,
      JSON.parse(runData.inputs),
      runData.output,
      runData.createdAt,
      runData.cost,
      runData.duration,
      JSON.parse(runData.labels),
      getID(runData)
    )
  )
}

const toRunData = (
  parentID: number,
  versionID: number,
  inputs: PromptInputs,
  output: string,
  createdAt: Date,
  cost: number,
  duration: number,
  labels: string[],
  runID?: number,
  promptID?: number // TODO safe to delete this after running next post-merge data migrations in prod
) => ({
  key: buildKey(Entity.RUN, runID),
  data: {
    parentID,
    versionID,
    inputs: JSON.stringify(inputs),
    output,
    createdAt,
    cost,
    duration,
    labels: JSON.stringify(labels),
    promptID,
  },
  excludeFromIndexes: ['output', 'inputs', 'labels'],
})

export const toRun = (data: any): Run => ({
  id: getID(data),
  timestamp: getTimestamp(data),
  inputs: JSON.parse(data.inputs),
  output: data.output,
  cost: data.cost,
  duration: data.duration,
  labels: JSON.parse(data.labels),
})
