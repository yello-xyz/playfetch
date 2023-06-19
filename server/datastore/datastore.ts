import { CheckValidURLPath, ProjectNameToURLPath } from '@/common/formatting'
import { Project, User } from '@/types'
import { Datastore, Key, PropertyFilter, Query } from '@google-cloud/datastore'
import { AggregateQuery } from '@google-cloud/datastore/build/src/aggregate'
import { EntityFilter } from '@google-cloud/datastore/build/src/filter'
import { createHash } from 'crypto'
import ShortUniqueId from 'short-unique-id'
import { updatePrompt } from './prompts'

export async function runDataMigration() {
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await updatePrompt(promptData)
  }
}

let datastore: Datastore
export const getDatastore = () => {
  if (!datastore) {
    datastore = new Datastore()
  }
  return datastore
}

export const getProjectID = async () => getDatastore().getProjectId()

export enum Entity {
  USER = 'user',
  PROJECT = 'project',
  PROMPT = 'prompt',
  VERSION = 'version',
  RUN = 'run',
  ENDPOINT = 'endpoint',
  CACHE = 'cache',
}

export const toID = ({ key }: { key: Key }) => Number(key.id)

const getKey = (entity: any) => entity[getDatastore().KEY] as Key

export const getID = (entity: any) => toID({ key: getKey(entity) })

export const getTimestamp = (entity: any, key = 'createdAt') => (entity[key] as Date)?.toISOString()

export const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

export const buildFilter = (key: string, value: {} | null) => new PropertyFilter(key, '=', value)

const projectQuery = (query: Query, keysOnly: boolean) => (keysOnly ? query.select('__key__') : query)

const orderQuery = (query: Query, sortKey: string | undefined) =>
  sortKey ? query.order(sortKey, { descending: true }) : query

const buildQuery = (
  type: string,
  filter: EntityFilter,
  limit: number,
  sortKey: string | undefined,
  keysOnly: boolean
) => projectQuery(orderQuery(getDatastore().createQuery(type).filter(filter).limit(limit), sortKey), keysOnly)

const getFilteredEntities = (
  type: string,
  filter: EntityFilter,
  limit = 100,
  sortKey: string | undefined = undefined,
  keysOnly = false
) =>
  getDatastore()
    .runQuery(buildQuery(type, filter, limit, sortKey, keysOnly))
    .then(([entities]) => entities)

export const getFilteredEntity = (type: string, filter: EntityFilter) =>
  getFilteredEntities(type, filter, 1).then(([entity]) => entity)

const getEntities = (type: string, key: string, value: {} | null, limit?: number, sortKey?: string) =>
  getFilteredEntities(type, buildFilter(key, value), limit, sortKey)

export const getOrderedEntities = (
  type: string,
  key: string,
  value: {} | null,
  sortKey = 'createdAt',
  limit?: number
) => getEntities(type, key, value, limit, sortKey)

export const getEntity = async (type: string, key: string, value: {} | null, mostRecent = false) =>
  getEntities(type, key, value, 1, mostRecent ? 'createdAt' : undefined).then(([entity]) => entity)

export const getEntityKeys = (type: string, key: string, value: {} | null, limit?: number) =>
  getFilteredEntities(type, buildFilter(key, value), limit, undefined, true).then(entities => entities.map(getKey))

export const getEntityID = (type: string, key: string, value: {} | null) =>
  getEntityKeys(type, key, value, 1).then(([key]) => toID({ key }))

const getKeyedEntities = async (type: string, ids: number[]) =>
  getDatastore()
    .get(ids.map(id => buildKey(type, id)))
    .then(([entities]) => entities)

export const getKeyedEntity = async (type: string, id: number) =>
  getKeyedEntities(type, [id]).then(([entity]) => entity)

export const getEntityCount = async (type: string, key: string, value: {} | null) => {
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
