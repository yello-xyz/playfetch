import { LogEntry, PromptInputs } from '@/types'
import { Entity, buildKey, getDatastore, getID, getOrderedEntities, getTimestamp } from './datastore'
import { ensureProjectAccess } from './projects'

export async function migrateLogs() {
  const datastore = getDatastore()
  const [allLogs] = await datastore.runQuery(datastore.createQuery(Entity.LOG))
  for (const logData of allLogs) {
    await getDatastore().save(
      toLogData(
        logData.projectID,
        logData.endpointID,
        JSON.parse(logData.inputs),
        JSON.parse(logData.output),
        logData.error,
        logData.createdAt,
        logData.cost,
        logData.duration,
        logData.cacheHit,
        logData.attempts,
        getID(logData)
      )
    )
  }
}

export async function getLogEntriesForProject(userID: number, projectID: number): Promise<LogEntry[]> {
  await ensureProjectAccess(userID, projectID)
  const logEntries = await getOrderedEntities(Entity.LOG, 'projectID', projectID)
  return logEntries.map(logData => toLogEntry(logData))
}

export async function saveLogEntry(
  projectID: number,
  endpointID: number,
  inputs: PromptInputs,
  output: object,
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
  output: object,
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

const toLogEntry = (data: any): LogEntry => ({
  endpointID: data.endpointID,
  inputs: JSON.parse(data.inputs),
  output: JSON.parse(data.output),
  error: data.error ?? null,
  timestamp: getTimestamp(data),
  cost: data.cost,
  duration: data.duration,
  cacheHit: data.cacheHit,
  attempts: data.attempts,
})
