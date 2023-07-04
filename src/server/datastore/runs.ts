import { PromptInputs, Run } from '@/types'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity, getTimestamp, toID } from './datastore'
import { ensurePromptAccess } from './prompts'

export async function migrateRuns() {
  const datastore = getDatastore()
  const [allRuns] = await datastore.runQuery(datastore.createQuery(Entity.RUN))
  for (const runData of allRuns) {
    const versionData = await getKeyedEntity(Entity.VERSION, runData.versionID)
    if (versionData && versionData.promptID !== runData.promptID) {
      await datastore.save(
        toRunData(
          versionData.promptID,
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
}

export async function saveRun(
  userID: number,
  promptID: number,
  versionID: number,
  inputs: PromptInputs,
  output: string,
  cost: number
): Promise<Run> {
  await ensurePromptAccess(userID, promptID)
  const runData = toRunData(promptID, versionID, inputs, output, new Date(), cost)
  await getDatastore().save(runData)
  return {
    id: toID(runData),
    timestamp: getTimestamp(runData.data),
    inputs: inputs,
    output: output,
    cost: cost,
  }
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
