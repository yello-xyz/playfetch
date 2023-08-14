import { PromptInputs } from '@/types'
import { Entity, buildKey, getDatastore, getID } from './datastore'

export async function migrateLogs() {
  const datastore = getDatastore()
  const [allLogs] = await datastore.runQuery(datastore.createQuery(Entity.LOG))
  for (const logData of allLogs) {
    await getDatastore().save(
      toLogData(
        logData.projectID,
        logData.endpointID,
        JSON.parse(logData.input),
        JSON.parse(logData.output ?? '{}'),
        logData.error,
        logData.createdAt,
        logData.cost,
        logData.duration,
        logData.cacheHit,
        logData.attempts,
        getID(logData),
      )
    )
  }
}

export async function saveLogEntry(
  projectID: number,
  endpointID: number,
  inputs: PromptInputs,
  output: any,
  error: string | undefined,
  cost: number,
  duration: number,
  cacheHit: boolean,
  attempts: number
) {
  await getDatastore().save(
    toLogData(projectID, endpointID, inputs, output, error, new Date(), cost, duration, cacheHit, attempts)
  )
}

const toLogData = (
  projectID: number,
  endpointID: number,
  inputs: PromptInputs,
  output: any,
  error: string | undefined,
  createdAt: Date,
  cost: number,
  duration: number,
  cacheHit: boolean,
  attempts: number,
  logID?: number
) => ({
  key: buildKey(Entity.LOG, logID),
  data: {
    projectID,
    endpointID,
    inputs: JSON.stringify(inputs),
    output: JSON.stringify(output),
    error,
    createdAt,
    cost,
    duration,
    cacheHit,
    attempts,
  },
  excludeFromIndexes: ['inputs', 'output', 'error'],
})

