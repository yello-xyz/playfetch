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
        logData.output ? JSON.parse(logData.output) : undefined,
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
  input: any,
  output: any | undefined,
  error: string | undefined,
  cost: number,
  duration: number,
  cacheHit: boolean,
  attempts: number
) {
  await getDatastore().save(
    toLogData(projectID, endpointID, input, output, error, new Date(), cost, duration, cacheHit, attempts)
  )
}

const toLogData = (
  projectID: number,
  endpointID: number,
  input: any,
  output: any | undefined,
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
    input: JSON.stringify(input),
    output: output ? JSON.stringify(output) : output,
    error,
    createdAt,
    cost,
    duration,
    cacheHit,
    attempts,
  },
  excludeFromIndexes: ['input', 'output', 'error'],
})
