import { Run, RunConfig } from "@/types"
import { Entity, buildKey, getDatastore, getID, getTimestamp } from "./datastore"

export async function saveRun(
  userID: number,
  promptID: number,
  versionID: number,
  output: string,
  config: RunConfig,
  cost: number
) {
  await getDatastore().save(toRunData(userID, promptID, versionID, output, new Date(), config, cost))
}

const toRunData = (
  userID: number,
  promptID: number,
  versionID: number,
  output: string,
  createdAt: Date,
  config: RunConfig,
  cost: number
) => ({
  key: buildKey(Entity.RUN),
  data: { userID, promptID, versionID, output, createdAt, config: JSON.stringify(config), cost },
  excludeFromIndexes: ['output', 'config'],
})

export const toRun = (data: any): Run => ({
  id: getID(data),
  timestamp: getTimestamp(data),
  output: data.output,
  config: JSON.parse(data.config),
  cost: data.cost,
})
