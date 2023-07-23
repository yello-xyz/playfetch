import { PromptInputs, Run } from '@/types'
import { Entity, buildKey, getDatastore, getID, getTimestamp } from './datastore'
import { ensurePromptAccess } from './prompts'

export async function migrateRuns() {
  const datastore = getDatastore()
  const [allRuns] = await datastore.runQuery(datastore.createQuery(Entity.RUN))
  for (const runData of allRuns) {
    await datastore.save(
      toRunData(
        runData.promptID,
        runData.versionID,
        JSON.parse(runData.inputs),
        runData.output,
        runData.createdAt,
        runData.cost,
        runData.duration,
        [],
        getID(runData)
      )
    )
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
