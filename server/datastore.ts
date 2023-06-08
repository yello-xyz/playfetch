import { BuildUniqueName, CheckValidURLPath, ProjectNameToURLPath, StripPromptSentinels } from '@/common/formatting'
import { Project, Prompt, Run, RunConfig, User, Version } from '@/types'
import { Datastore, Key, PropertyFilter, Query, and } from '@google-cloud/datastore'
import { AggregateQuery } from '@google-cloud/datastore/build/src/aggregate'
import { EntityFilter } from '@google-cloud/datastore/build/src/filter'

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
}

const getKey = (entity: any) => entity[getDatastore().KEY] as Key

const getID = (entity: any) => Number(getKey(entity).id)

const getTimestamp = (entity: any, key = 'createdAt') => (entity[key] as Date).toISOString()

const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

const projectQuery = (query: Query, keysOnly: boolean) => (keysOnly ? query.select('__key__') : query)

const buildQuery = (type: string, filter: EntityFilter, limit = 100, keysOnly = false) =>
  projectQuery(
    getDatastore().createQuery(type).filter(filter).order('createdAt', { descending: true }).limit(limit),
    keysOnly
  )

const buildFilter = (key: string, value: {}) => new PropertyFilter(key, '=', value)

const getFilteredEntities = (type: string, filter: EntityFilter, limit?: number, keysOnly = false) =>
  getDatastore()
    .runQuery(buildQuery(type, filter, limit, keysOnly))
    .then(([entities]) => entities)

const getEntities = (type: string, key: string, value: {}, limit?: number) =>
  getFilteredEntities(type, buildFilter(key, value), limit)

const getEntity = async (type: string, key: string, value: {}) =>
  getEntities(type, key, value, 1).then(([entity]) => entity)

const getUserScopedEntities = (type: string, key: string, value: {}, userID: number, limit?: number) =>
  getFilteredEntities(type, and([buildFilter(key, value), buildFilter('userID', userID)]), limit)

const getFilteredKeys = (type: string, filter: EntityFilter, limit?: number) =>
  getFilteredEntities(type, filter, limit, true).then(entities => entities.map(getKey))

const getEntityKeys = (type: string, key: string, value: {}, limit?: number) =>
  getFilteredKeys(type, buildFilter(key, value), limit)

const getEntityKey = (type: string, key: string, value: {}) => getEntityKeys(type, key, value, 1).then(([key]) => key)

const getKeyedEntities = async (type: string, ids: number[]) =>
  getDatastore()
    .get(ids.map(id => buildKey(type, id)))
    .then(([entities]) => entities)

const getKeyedEntity = async (type: string, id: number) => getKeyedEntities(type, [id]).then(([entity]) => entity)

const getEntityCount = async (type: string, key: string, value: {}) => {
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
  lastLoginAt: data.lastLoginAt ? getTimestamp(data, 'lastLoginAt') : undefined,
})

export async function markUserLogin(userID: number): Promise<User | undefined> {
  const [userData] = await getDatastore().get(buildKey(Entity.USER, userID))
  if (userData) {
    await getDatastore().save(toUserData(userData.email, userData.isAdmin, userData.createdAt, new Date(), userID))
  }
  return userData ? toUser(userData) : userData
}

export async function getUserForEmail(email: string): Promise<User | undefined> {
  const userData = await getEntity(Entity.USER, 'email', email)
  return userData ? toUser(userData) : userData
}

export async function saveUser(email: string, isAdmin: boolean) {
  const userData = await getEntity(Entity.USER, 'email', email)
  await getDatastore().save(
    toUserData(email, isAdmin, userData?.createdAt ?? new Date(), userData?.lastLoginAt, userData?.id)
  )
}

const toProjectData = (userID: number, name: string, urlPath: string, createdAt: Date) => ({
  key: buildKey(Entity.PROJECT),
  data: { userID, name, createdAt, urlPath },
  excludeFromIndexes: ['name'],
})

const toProject = (data: any, prompts: any[]): Project => ({
  id: getID(data),
  name: data.name,
  urlPath: data.urlPath,
  timestamp: getTimestamp(data),
  prompts: prompts.filter(prompt => prompt.projectID === getID(data)).map(toPrompt),
})

export async function addProjectForUser(userID: number, projectName: string): Promise<number> {
  const urlPath = ProjectNameToURLPath(projectName)
  if (!CheckValidURLPath(urlPath)) {
    throw new Error(`URL path '${urlPath}' is invalid`)
  }
  if (await getProjectIDFromURLPath(urlPath)) {
    throw new Error(`URL path '${urlPath}' already exists`)
  }
  const projectData = toProjectData(userID, projectName, urlPath, new Date())
  await getDatastore().save(projectData)
  return await addPromptForUser(userID, Number(projectData.key.id))
}

export async function getProjectIDFromURLPath(urlPath: string): Promise<number | undefined> {
  const projectKey = await getEntityKey(Entity.PROJECT, 'urlPath', urlPath)
  return projectKey ? Number(projectKey.id) : undefined
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const projects = await getEntities(Entity.PROJECT, 'userID', userID)
  const prompts = await getEntities(Entity.PROMPT, 'userID', userID)
  return projects.map(project => toProject(project, prompts))
}

const toPromptData = (userID: number, projectID: number, name: string, createdAt: Date, promptID?: number) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { userID, projectID, name, createdAt },
  excludeFromIndexes: ['name'],
})

const toPrompt = (data: any): Prompt => ({ id: getID(data), name: data.name })

export async function addPromptForUser(userID: number, projectID: number): Promise<number> {
  const existingPrompts = await getUserScopedEntities(Entity.PROMPT, 'projectID', projectID, userID)
  const name = BuildUniqueName(
    'New Prompt',
    existingPrompts.map(prompt => prompt.name)
  )
  const promptData = toPromptData(userID, projectID, name, new Date())
  await getDatastore().save(promptData)
  await savePromptForUser(userID, Number(promptData.key.id), name, '', '')
  return Number(promptData.key.id)
}

async function updatePromptNameIfNeeded(promptData: any) {
  const promptID = getID(promptData)
  const lastVersionData = await getEntity(Entity.VERSION, 'promptID', promptID)
  const promptName = lastVersionData.title.length ? lastVersionData.title : StripPromptSentinels(lastVersionData.prompt)
  if (promptName !== promptData.name) {
    await datastore.save(
      toPromptData(promptData.userID, promptData.projectID, promptName, promptData.createdAt, promptID)
    )
  }
}

export async function savePromptForUser(
  userID: number,
  promptID: number,
  prompt: string,
  title: string,
  tags: string,
  currentVersionID?: number
) {
  const promptData = await getKeyedEntity(Entity.PROMPT, promptID)
  if (promptData?.userID !== userID) {
    return undefined
  }

  const currentVersion = currentVersionID ? await getKeyedEntity(Entity.VERSION, currentVersionID) : undefined
  const canOverwrite =
    currentVersionID &&
    (prompt === currentVersion.prompt || !(await getEntity(Entity.RUN, 'versionID', currentVersionID)))
  const versionID = canOverwrite ? currentVersionID : undefined
  const previousVersionID = canOverwrite ? currentVersion.previousVersionID : currentVersionID
  const createdAt = canOverwrite ? currentVersion.createdAt : new Date()

  const versionData = toVersionData(userID, promptID, prompt, title, tags, createdAt, previousVersionID, versionID)
  await getDatastore().save(versionData)
  await updatePromptNameIfNeeded(promptData)

  return Number(versionData.key.id)
}

const toVersionData = (
  userID: number,
  promptID: number,
  prompt: string,
  title: string,
  tags: string,
  createdAt: Date,
  previousVersionID?: number,
  versionID?: number
) => ({
  key: buildKey(Entity.VERSION, versionID),
  data: { userID, promptID, prompt, title, tags, createdAt, previousVersionID },
  excludeFromIndexes: ['prompt', 'title', 'tags'],
})

const toVersion = (data: any, runs: any[]): Version => ({
  id: getID(data),
  previousID: data.previousVersionID ?? null,
  timestamp: getTimestamp(data),
  prompt: data.prompt,
  title: data.title,
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
    const promptCount = await getEntityCount(Entity.PROMPT, 'projectID', promptData.projectID)
    if (promptCount <= 1) {
      keysToDelete.push(buildKey(Entity.PROJECT, promptData.projectID))
    }
  }
  await getDatastore().delete(keysToDelete)
  if (versionCount > 1) {
    await updatePromptNameIfNeeded(promptData)
  }
}

export async function getVersionsForPrompt(userID: number, promptID: number): Promise<Version[]> {
  const versions = await getEntities(Entity.VERSION, 'promptID', promptID)
  const runs = await getEntities(Entity.RUN, 'promptID', promptID)
  return versions.filter(version => version.userID === userID).map(version => toVersion(version, runs))
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
