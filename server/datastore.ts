import { CheckValidURLPath, ProjectNameToURLPath, StripPromptSentinels } from '@/common/formatting'
import { Endpoint, Project, Prompt, ActivePrompt, Run, RunConfig, User, Version } from '@/types'
import { Datastore, Key, PropertyFilter, Query, and } from '@google-cloud/datastore'
import { AggregateQuery } from '@google-cloud/datastore/build/src/aggregate'
import { EntityFilter } from '@google-cloud/datastore/build/src/filter'
import { createHash } from 'crypto'
import ShortUniqueId from 'short-unique-id'

let datastore: Datastore
const getDatastore = () => {
  if (!datastore) {
    datastore = new Datastore()
  }
  return datastore
}

export const getProjectID = async () => getDatastore().getProjectId()

enum Entity {
  USER = 'user',
  PROJECT = 'project',
  PROMPT = 'prompt',
  VERSION = 'version',
  RUN = 'run',
  ENDPOINT = 'endpoint',
  CACHE = 'cache',
}

const toID = ({ key }: { key: Key }) => Number(key.id)

const getKey = (entity: any) => entity[getDatastore().KEY] as Key

const getID = (entity: any) => toID({ key: getKey(entity) })

const getTimestamp = (entity: any, key = 'createdAt') => (entity[key] as Date)?.toISOString()

const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

const buildFilter = (key: string, value: {} | null) => new PropertyFilter(key, '=', value)

const projectQuery = (query: Query, keysOnly: boolean) => (keysOnly ? query.select('__key__') : query)

const orderQuery = (query: Query, ordered: boolean) =>
  ordered ? query.order('createdAt', { descending: true }) : query

const buildQuery = (type: string, filter: EntityFilter, limit = 100, ordered = false, keysOnly = false) =>
  projectQuery(orderQuery(getDatastore().createQuery(type).filter(filter).limit(limit), ordered), keysOnly)

const getFilteredEntities = (type: string, filter: EntityFilter, limit?: number, ordered = false, keysOnly = false) =>
  getDatastore()
    .runQuery(buildQuery(type, filter, limit, ordered, keysOnly))
    .then(([entities]) => entities)

const getFilteredEntity = (type: string, filter: EntityFilter) =>
  getFilteredEntities(type, filter, 1).then(([entity]) => entity)

const getEntities = (type: string, key: string, value: {} | null, limit?: number, ordered = false) =>
  getFilteredEntities(type, buildFilter(key, value), limit, ordered)

const getOrderedEntities = (type: string, key: string, value: {} | null, limit?: number) =>
  getEntities(type, key, value, limit, true)

const getEntity = async (type: string, key: string, value: {} | null, mostRecent = false) =>
  getEntities(type, key, value, 1, mostRecent).then(([entity]) => entity)

const getUserScopedEntities = (type: string, key: string, value: {} | null, userID: number, limit?: number) =>
  getFilteredEntities(type, and([buildFilter(key, value), buildFilter('userID', userID)]), limit)

const getEntityKeys = (type: string, key: string, value: {} | null, limit?: number) =>
  getFilteredEntities(type, buildFilter(key, value), limit, false, true).then(entities => entities.map(getKey))

const getEntityID = (type: string, key: string, value: {} | null) =>
  getEntityKeys(type, key, value, 1).then(([key]) => toID({ key }))

const getKeyedEntities = async (type: string, ids: number[]) =>
  getDatastore()
    .get(ids.map(id => buildKey(type, id)))
    .then(([entities]) => entities)

const getKeyedEntity = async (type: string, id: number) => getKeyedEntities(type, [id]).then(([entity]) => entity)

const getEntityCount = async (type: string, key: string, value: {} | null) => {
  const datastore = getDatastore()
  const query = datastore.createQuery(type).filter(buildFilter(key, value))
  const [[{ count }]] = await datastore.runAggregationQuery(new AggregateQuery(query).count('count'))
  return count
}

const toUserData = (email: string, isAdmin: boolean, createdAt: Date, lastLoginAt?: Date, userID?: number) => ({
  key: buildKey(Entity.USER, userID),
  data: { email, isAdmin, createdAt, lastLoginAt },
})

const toUser = (data: any): User => ({
  id: getID(data),
  email: data.email,
  isAdmin: data.isAdmin,
  timestamp: getTimestamp(data),
  lastLoginAt: getTimestamp(data, 'lastLoginAt'),
})

export async function markUserLogin(userID: number): Promise<User | undefined> {
  const [userData] = await getDatastore().get(buildKey(Entity.USER, userID))
  if (userData) {
    await getDatastore().save(toUserData(userData.email, userData.isAdmin, userData.createdAt, new Date(), userID))
  }
  return userData ? toUser(userData) : undefined
}

export async function getUserForEmail(email: string): Promise<User | undefined> {
  const userData = await getEntity(Entity.USER, 'email', email)
  return userData ? toUser(userData) : undefined
}

export async function saveUser(email: string, isAdmin: boolean) {
  const userData = await getEntity(Entity.USER, 'email', email)
  await getDatastore().save(
    toUserData(email, isAdmin, userData?.createdAt ?? new Date(), userData?.lastLoginAt, userData?.id)
  )
}

const hashAPIKey = (apiKey: string) => createHash('sha256').update(apiKey).digest('hex')

const toProjectData = (
  userID: number,
  name: string,
  urlPath: string,
  createdAt: Date,
  apiKeyHash?: string,
  projectID?: number
) => ({
  key: buildKey(Entity.PROJECT, projectID),
  data: { userID, name, createdAt, urlPath, apiKeyHash },
  excludeFromIndexes: ['name', 'apiKeyHash'],
})

const toProject = (data: any): Project => ({
  id: getID(data),
  name: data.name,
  urlPath: data.urlPath ?? '',
  timestamp: getTimestamp(data),
})

export async function addProjectForUser(userID: number, projectName: string) {
  const urlPath = ProjectNameToURLPath(projectName)
  if (!CheckValidURLPath(urlPath)) {
    throw new Error(`URL path '${urlPath}' is invalid`)
  }
  if (await checkProject(urlPath)) {
    throw new Error(`URL path '${urlPath}' already exists`)
  }
  const projectData = toProjectData(userID, projectName, urlPath, new Date())
  await getDatastore().save(projectData)
  return toID(projectData)
}

export async function checkProject(urlPath: string, apiKey?: string): Promise<boolean> {
  const projectData = await getEntity(Entity.PROJECT, 'urlPath', urlPath)
  return projectData && (!apiKey || projectData.apiKeyHash === hashAPIKey(apiKey))
}

export async function getURLPathForProject(projectID: number): Promise<string> {
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  return projectData?.urlPath ?? ''
}

export async function rotateProjectAPIKey(userID: number, projectID: number): Promise<string> {
  const projectData = await getKeyedEntity(Entity.PROJECT, projectID)
  if (projectData?.userID !== userID) {
    throw new Error(`Project with ID ${projectID} does not exist or user has no access`)
  }
  const apiKey = `sk-${new ShortUniqueId({ length: 48, dictionary: 'alphanum' })()}`
  const apiKeyHash = hashAPIKey(apiKey)
  await getDatastore().save(
    toProjectData(
      projectData.userID,
      projectData.name,
      projectData.urlPath,
      projectData.createdAt,
      apiKeyHash,
      projectID
    )
  )
  return apiKey
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const projects = await getOrderedEntities(Entity.PROJECT, 'userID', userID)
  return projects.map(project => toProject(project))
}

const toPromptData = (
  userID: number,
  projectID: number | null,
  name: string,
  prompt: string,
  createdAt: Date,
  lastEditedAt?: Date,
  promptID?: number
) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { userID, projectID, prompt, name, createdAt, lastEditedAt },
  excludeFromIndexes: ['name', 'prompt'],
})

const toPrompt = (data: any): Prompt => ({
  id: getID(data),
  name: data.name,
  prompt: StripPromptSentinels(data.prompt ?? ''),
  projectID: data.projectID,
  timestamp: getTimestamp(data, 'lastEditedAt') ?? getTimestamp(data),
})

const toActivePrompt = (data: any, versions: any[], runs: any[], endpointData?: any): ActivePrompt => ({
  ...toPrompt(data),
  versions: versions.map(version => toVersion(version, runs)),
  ...(endpointData ? { endpoint: toEndpoint(endpointData) } : {}),
})

export async function getPromptsForProject(userID: number, projectID: number | null): Promise<Prompt[]> {
  const prompts = await getOrderedEntities(Entity.PROMPT, 'projectID', projectID)
  return prompts.filter(prompt => prompt.userID === userID).map(prompt => toPrompt(prompt))
}

export async function getPromptWithVersions(userID: number, promptID: number): Promise<ActivePrompt> {
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  if (!promptData || promptData?.userID !== userID) {
    throw new Error(`Prompt with ID ${promptID} does not exist or user has no access`)
  }
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, promptID)
  const versions = await getOrderedEntities(Entity.VERSION, 'promptID', promptID)
  const runs = await getOrderedEntities(Entity.RUN, 'promptID', promptID)
  versions.filter(version => version.userID === userID).map(version => toVersion(version, runs))

  return toActivePrompt(
    promptData,
    versions.filter(version => version.userID === userID),
    runs,
    endpointData
  )
}

export async function addPromptForUser(userID: number, name: string, projectID: number | null): Promise<number> {
  const promptData = toPromptData(userID, projectID, name, '', new Date())
  await getDatastore().save(promptData)
  await savePromptForUser(userID, toID(promptData), '', '')
  return toID(promptData)
}

async function updatePrompt(promptData: any) {
  const promptID = getID(promptData)
  const lastVersionData = await getEntity(Entity.VERSION, 'promptID', promptID, true)
  await datastore.save(
    toPromptData(
      promptData.userID,
      promptData.projectID,
      promptData.name,
      lastVersionData.prompt,
      promptData.createdAt,
      new Date(),
      promptID
    )
  )
}

export async function savePromptForUser(
  userID: number,
  promptID: number,
  prompt: string,
  tags: string,
  currentVersionID?: number
) {
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  if (promptData?.userID !== userID) {
    return undefined
  }

  let currentVersion = currentVersionID ? await getKeyedEntity(Entity.VERSION, currentVersionID) : undefined
  const canOverwrite =
    currentVersionID &&
    (prompt === currentVersion.prompt || !(await getEntity(Entity.RUN, 'versionID', currentVersionID)))

  if (canOverwrite && prompt !== currentVersion.prompt) {
    const previousVersion = currentVersion.previousVersionID
      ? await getKeyedEntity(Entity.VERSION, currentVersion.previousVersionID)
      : undefined
    if (previousVersion && previousVersion.prompt === prompt) {
      await datastore.delete(buildKey(Entity.VERSION, currentVersionID))
      currentVersionID = currentVersion.previousVersionID
      currentVersion = previousVersion
    }
  }

  const versionID = canOverwrite ? currentVersionID : undefined
  const previousVersionID = canOverwrite ? currentVersion.previousVersionID : currentVersionID
  const createdAt = canOverwrite ? currentVersion.createdAt : new Date()

  const versionData = toVersionData(userID, promptID, prompt, tags, createdAt, previousVersionID, versionID)
  await getDatastore().save(versionData)
  await updatePrompt(promptData)

  return toID(versionData)
}

const toVersionData = (
  userID: number,
  promptID: number,
  prompt: string,
  tags: string,
  createdAt: Date,
  previousVersionID?: number,
  versionID?: number
) => ({
  key: buildKey(Entity.VERSION, versionID),
  data: { userID, promptID, prompt, tags, createdAt, previousVersionID },
  excludeFromIndexes: ['prompt', 'tags'],
})

const toVersion = (data: any, runs: any[]): Version => ({
  id: getID(data),
  previousID: data.previousVersionID ?? null,
  timestamp: getTimestamp(data),
  prompt: data.prompt,
  tags: data.tags,
  runs: runs.filter(run => run.versionID === getID(data)).map(toRun),
})

export async function deleteVersionForUser(userID: number, versionID: number) {
  const versionData = await getKeyedEntity(Entity.VERSION, versionID)
  if (versionData?.userID !== userID) {
    throw new Error(`Version with ID ${versionID} does not exist or user has no access`)
  }

  const keysToDelete = await getEntityKeys(Entity.RUN, 'versionID', versionID)
  keysToDelete.push(buildKey(Entity.VERSION, versionID))
  const versionCount = await getEntityCount(Entity.VERSION, 'promptID', versionData.promptID)
  const promptData = await getKeyedEntity(Entity.PROMPT, versionData.promptID)
  if (versionCount <= 1) {
    keysToDelete.push(buildKey(Entity.PROMPT, versionData.promptID))
    keysToDelete.push(buildKey(Entity.ENDPOINT, versionData.promptID))
  }
  await getDatastore().delete(keysToDelete)
  if (versionCount > 1) {
    await updatePrompt(promptData)
  }
}

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

const toRun = (data: any): Run => ({
  id: getID(data),
  timestamp: getTimestamp(data),
  output: data.output,
  config: JSON.parse(data.config),
  cost: data.cost,
})

export async function checkCanSaveEndpoint(
  promptID: number,
  urlPath: string,
  projectURLPath: string
): Promise<boolean> {
  const endpointData = await getEndpointFromPath(urlPath, projectURLPath)
  return !endpointData || endpointData.id === promptID
}

export async function saveEndpoint(
  userID: number,
  promptID: number,
  urlPath: string,
  projectURLPath: string,
  prompt: string,
  config: RunConfig
) {
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  if (promptData?.userID !== userID) {
    throw new Error(`Prompt with ID ${promptID} does not exist or user has no access`)
  }
  const projectID = await getEntityID(Entity.PROJECT, 'urlPath', projectURLPath)
  if (!projectID) {
    throw new Error(`Project with URL path ${projectURLPath} does not exist`)
  }
  if (promptData?.projectID !== projectID) {
    throw new Error(`Prompt with ID ${promptID} does not belong to project with ID ${projectID}`)
  }
  if (!(await checkCanSaveEndpoint(promptID, urlPath, projectURLPath))) {
    throw new Error(`Endpoint ${urlPath} already used for different prompt in project with ID ${projectID}`)
  }
  const token = new ShortUniqueId({ length: 12, dictionary: 'alpha_upper' })()
  await getDatastore().save(
    toEndpointData(userID, promptID, urlPath, projectURLPath, new Date(), prompt, config, token)
  )
}

export async function getEndpoint(promptID: number): Promise<Endpoint | undefined> {
  const endpoint = await getKeyedEntity(Entity.ENDPOINT, promptID)
  return endpoint ? toEndpoint(endpoint) : undefined
}

export async function getEndpointFromPath(
  urlPath: string,
  projectURLPath: string,
  token?: string
): Promise<Endpoint | undefined> {
  const endpoint = await getFilteredEntity(
    Entity.ENDPOINT,
    and([buildFilter('urlPath', urlPath), buildFilter('projectURLPath', projectURLPath)])
  )
  return endpoint && (!token || endpoint.token === token) ? toEndpoint(endpoint) : undefined
}

export async function deleteEndpointForUser(userID: number, promptID: number) {
  const endpointData = await getKeyedEntity(Entity.ENDPOINT, promptID)
  if (endpointData?.userID !== userID) {
    throw new Error(`Endpoint with ID ${promptID} does not exist or user has no access`)
  }
  await getDatastore().delete(buildKey(Entity.ENDPOINT, promptID))
}

const toEndpointData = (
  userID: number,
  promptID: number,
  urlPath: string,
  projectURLPath: string,
  createdAt: Date,
  prompt: string,
  config: RunConfig,
  token: string
) => ({
  key: buildKey(Entity.ENDPOINT, promptID),
  data: { userID, urlPath, projectURLPath, createdAt, prompt, config: JSON.stringify(config), token },
  excludeFromIndexes: ['prompt', 'config'],
})

const toEndpoint = (data: any): Endpoint => ({
  id: getID(data),
  timestamp: getTimestamp(data),
  urlPath: data.urlPath,
  projectURLPath: data.projectURLPath,
  prompt: data.prompt,
  config: JSON.parse(data.config),
  token: data.token,
})

export async function cacheValue(key: number, value: string) {
  await getDatastore().save({
    key: buildKey(Entity.CACHE, key),
    data: { value },
    excludeFromIndexes: ['value'],
  })
}

export async function getCachedValue(key: number) {
  const cachedValue = await getKeyedEntity(Entity.CACHE, key)
  return cachedValue ? cachedValue.value : undefined
}
