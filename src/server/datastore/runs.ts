import { PromptInputs, Run } from '@/types'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity, getTimestamp } from './datastore'
import { ensurePromptAccess } from './prompts'
import { processLabels } from './versions'

export async function migrateRuns() {
  const datastore = getDatastore()
  const [allRuns] = await datastore.runQuery(datastore.createQuery(Entity.RUN))
  for (const runData of allRuns) {
    await updateRun({ ...runData })
  }
}

export async function saveRun(
  userID: number,
  promptID: number,
  versionID: number,
  inputs: PromptInputs,
  output: string,
  createdAt: Date,
  cost: number,
  duration: number,
  labels: string[]
): Promise<Run> {
  await ensurePromptAccess(userID, promptID)
  const runData = toRunData(promptID, versionID, inputs, output, createdAt, cost, duration, labels)
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
  await ensurePromptAccess(userID, runData.promptID)
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
    runData.promptID,
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
      runData.promptID,
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
  promptID: number,
  versionID: number,
  inputs: PromptInputs,
  output: string,
  createdAt: Date,
  cost: number,
  duration: number,
  labels: string[],
  runID?: number
) => ({
  key: buildKey(Entity.RUN, runID),
  data: {
    promptID,
    versionID,
    inputs: JSON.stringify(inputs),
    output,
    createdAt,
    cost,
    duration,
    labels: JSON.stringify(labels),
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
