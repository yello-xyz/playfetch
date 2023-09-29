import { LogEntry, PromptInputs } from '@/types'
import { Entity, buildKey, getDatastore, getID, getOrderedEntities, getTimestamp } from './datastore'
import { ensureProjectAccess } from './projects'
import { updateAnalytics } from './analytics'

export async function migrateLogs(postMerge: boolean) {
  if (postMerge) {
    return
  }
  const datastore = getDatastore()
  const [allLogs] = await datastore.runQuery(datastore.createQuery(Entity.LOG).order('createdAt', { descending: false }))
  for (const [index, logData] of allLogs.entries()) {
    console.log(`[${index + 1}/${allLogs.length}] ${getID(logData)} ${logData.createdAt}`)
    await updateAnalytics(
      logData.projectID,
      logData.cost,
      logData.duration,
      logData.cacheHit,
      logData.attempts,
      !!logData.error,
      logData.createdAt,
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
  versionID: number,
  inputs: PromptInputs,
  output: object,
  error: string | undefined,
  cost: number,
  duration: number,
  attempts: number,
  cacheHit: boolean,
  continuationID: number | undefined
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
      attempts,
      cacheHit,
      continuationID
    )
  )
}

const toLogData = (
  projectID: number,
  endpointID: number,
  urlPath: string,
  flavor: string,
  parentID: number,
  versionID: number,
  inputs: PromptInputs,
  output: object,
  error: string | undefined,
  createdAt: Date,
  cost: number,
  duration: number,
  attempts: number,
  cacheHit: boolean,
  continuationID: number | undefined,
  logID?: number
) => ({
  key: buildKey(Entity.LOG, logID),
  data: {
    projectID,
    endpointID,
    urlPath,
    flavor,
    parentID,
    versionID: versionID,
    inputs: JSON.stringify(inputs),
    output: JSON.stringify(output),
    error: error ?? null,
    createdAt,
    cost,
    duration,
    attempts,
    cacheHit,
    continuationID: continuationID ?? null,
  },
  excludeFromIndexes: ['inputs', 'output', 'error'],
})

const toLogEntry = (data: any): LogEntry => ({
  endpointID: data.endpointID,
  urlPath: data.urlPath,
  flavor: data.flavor,
  parentID: data.parentID,
  versionID: data.versionID,
  inputs: JSON.parse(data.inputs),
  output: JSON.parse(data.output),
  error: data.error ?? null,
  timestamp: getTimestamp(data),
  cost: data.cost,
  duration: data.duration,
  attempts: data.attempts,
  cacheHit: data.cacheHit,
  continuationID: data.continuationID ?? null,
})
