import { LogEntry, PromptInputs } from '@/types'
import { Entity, buildKey, getDatastore, getID, getKeyedEntity, getOrderedEntities, getTimestamp } from './datastore'
import { ensureProjectAccess } from './projects'

export async function migrateLogs() {
  const datastore = getDatastore()
  const [allLogs] = await datastore.runQuery(datastore.createQuery(Entity.LOG))
  for (const logData of allLogs) {
    const endpoint = await getKeyedEntity(Entity.ENDPOINT, logData.endpointID)
    await getDatastore().save(
      toLogData(
        logData.projectID,
        logData.endpointID,
        endpoint.urlPath,
        endpoint.flavor,
        endpoint.parentID,
        endpoint.versionID,
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
  urlPath: string,
  flavor: string,
  parentID: number,
  versionID: number | undefined,
  inputs: PromptInputs,
  output: object,
  error: string | undefined,
  cost: number,
  duration: number,
  cacheHit: boolean,
  attempts: number
) {
  await getDatastore().save(
    toLogData(
      projectID,
      endpointID,
      urlPath,
      flavor,
      parentID,
      versionID,
      inputs,
      output,
      error,
      new Date(),
      cost,
      duration,
      cacheHit,
      attempts
    )
  )
}

const toLogData = (
  projectID: number,
  endpointID: number,
  urlPath: string,
  flavor: string,
  parentID: number,
  versionID: number | undefined,
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
    urlPath,
    flavor,
    parentID,
    versionID: versionID ?? null,
    inputs: JSON.stringify(inputs),
    output: JSON.stringify(output),
    error: error ?? null,
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
  urlPath: data.urlPath,
  flavor: data.flavor,
  parentID: data.parentID,
  versionID: data.versionID ?? null,
  inputs: JSON.parse(data.inputs),
  output: JSON.parse(data.output),
  error: data.error ?? null,
  timestamp: getTimestamp(data),
  cost: data.cost,
  duration: data.duration,
  cacheHit: data.cacheHit,
  attempts: data.attempts,
})
