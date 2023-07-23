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
        0,
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
  duration: number
): Promise<Run> {
  await ensurePromptAccess(userID, promptID)
  const runData = toRunData(promptID, versionID, inputs, output, createdAt, cost, duration)
  await getDatastore().save(runData)
  return {
    id: getID(runData),
    timestamp: getTimestamp(runData.data),
    inputs,
    output,
    cost,
    duration,
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
  runID?: number
) => ({
  key: buildKey(Entity.RUN, runID),
  data: { promptID, versionID, inputs: JSON.stringify(inputs), output, createdAt, cost, duration },
  excludeFromIndexes: ['output', 'inputs'],
})

export const toRun = (data: any): Run => ({
  id: getID(data),
  timestamp: getTimestamp(data),
  inputs: JSON.parse(data.inputs),
  output: data.output,
  cost: data.cost,
  duration: data.duration,
})
