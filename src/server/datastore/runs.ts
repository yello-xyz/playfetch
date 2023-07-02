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
  cost: number
) {
  await ensurePromptAccess(userID, promptID)
  await getDatastore().save(toRunData(promptID, versionID, inputs, output, new Date(), cost))
}

const toRunData = (
  promptID: number,
  versionID: number,
  inputs: PromptInputs,
  output: string,
  createdAt: Date,
  cost: number,
  runID?: number
) => ({
  key: buildKey(Entity.RUN, runID),
  data: { promptID, versionID, inputs: JSON.stringify(inputs), output, createdAt, cost },
  excludeFromIndexes: ['output', 'config'],
})

export const toRun = (data: any): Run => ({
  id: getID(data),
  timestamp: getTimestamp(data),
  inputs: JSON.parse(data.inputs),
  output: data.output,
  cost: data.cost,
})
