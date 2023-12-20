import { LogEntry, PromptInputs } from '@/types'
import { Entity, buildKey, getDatastore, getID, getOrderedEntities, getTimestamp } from './datastore'
import { ensureProjectAccess } from './projects'

export async function migrateLogs(postMerge: boolean) {
  const datastore = getDatastore()
  const [allLogs] = await datastore.runQuery(datastore.createQuery(Entity.LOG))
  const usedEndpointIDs = new Set(allLogs.map(logData => logData.endpointID))
  const usedProjectIDs = new Set(allLogs.map(logData => logData.projectID))
  const [allEndpoints] = await datastore.runQuery(datastore.createQuery(Entity.ENDPOINT))
  const allEndpointIDs = new Set(allEndpoints.map(endpoint => getID(endpoint)))
  const [allProjects] = await datastore.runQuery(datastore.createQuery(Entity.PROJECT))
  const allProjectIDs = new Set(allProjects.map(project => getID(project)))
  console.log(
    `Found ${allLogs.length} logs ` +
      `(for ${usedEndpointIDs.size} endpoints out of ${allEndpoints.length}) ` +
      `(for ${usedProjectIDs.size} projects out of ${allProjectIDs.size})`
  )
  for (const logData of allLogs) {
    if (!!logData.endpointID && !allEndpointIDs.has(logData.endpointID)) {
      console.log(`Deleting log ${getID(logData)} for missing endpoint ${logData.endpointID}`)
      if (postMerge) {
        await datastore.delete(buildKey(Entity.LOG, getID(logData)))
      }
    } else if (!!logData.projectID && !allProjectIDs.has(logData.projectID)) {
      console.log(`Deleting log ${getID(logData)} for missing project ${logData.projectID}`)
      if (postMerge) {
        await datastore.delete(buildKey(Entity.LOG, getID(logData)))
      }
    }
    // await datastore.save(
    //   toLogData(
    //     logData.projectID,
    //     logData.endpointID,
    //     logData.urlPath,
    //     logData.flavor,
    //     logData.parentID,
    //     logData.versionID,
    //     JSON.parse(logData.inputs),
    //     JSON.parse(logData.output),
    //     logData.error,
    //     logData.createdAt,
    //     logData.cost,
    //     logData.duration,
    //     logData.attempts,
    //     logData.cacheHit,
    //     logData.continuationID,
    //     getID(logData)
    //   )
    // )
  }
}

export async function getLogEntriesForProject(userID: number, projectID: number, trusted = false): Promise<LogEntry[]> {
  if (!trusted) {
    await ensureProjectAccess(userID, projectID)
  }
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
