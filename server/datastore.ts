import { Project, Prompt, User, Version } from '@/types'
import { Datastore, PropertyFilter, and } from '@google-cloud/datastore'
import { EntityFilter } from '@google-cloud/datastore/build/src/filter'

let datastore: Datastore
const getDatastore = () => {
  if (!datastore) {
    datastore = new Datastore()
  }
  return datastore
}

enum Entity {
  USER = 'user',
  PROJECT = 'project',
  PROMPT = 'prompt',
  VERSION = 'version',
}

const getID = (entity: any) => Number(entity[getDatastore().KEY].id)

const getTimestamp = (entity: any) => (entity.createdAt as Date).toISOString()

const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

const buildQuery = (type: string, filter: EntityFilter, limit: number = 100) =>
  getDatastore().createQuery(type).filter(filter).order('createdAt', { descending: true }).limit(limit)

const getFilteredEntities = (type: string, filter: EntityFilter, limit?: number) =>
  getDatastore().runQuery(buildQuery(type, filter, limit))

const getEntities = (type: string, key: string, value: {}, limit?: number) =>
  getFilteredEntities(type, new PropertyFilter(key, '=', value), limit)

const getEntity = async (type: string, key: string, value: {}) =>
  getEntities(type, key, value, 1).then(([[entity]]) => entity)

const toUser = (data: any): User => ({ id: getID(data), email: data.email, isAdmin: data.isAdmin })

export async function markUserLogin(userID: number): Promise<User | undefined> {
  const key = buildKey(Entity.USER, userID)
  const [userData] = await getDatastore().get(key)
  if (userData) {
    const lastLoginAt = new Date()
    await getDatastore().save({ key, data: { ...userData, lastLoginAt } })
  }
  return userData ? toUser(userData) : userData
}

export async function getUserForEmail(email: string): Promise<User | undefined> {
  const userData = await getEntity(Entity.USER, 'email', email)
  return userData ? toUser(userData) : userData
}

export async function saveUser(email: string, isAdmin: boolean) {
  const user = await getUserForEmail(email)
  const key = buildKey(Entity.USER, user?.id)
  await getDatastore().save({ key, data: { email, isAdmin, createdAt: new Date() } })
}

const toProject = (data: any, prompts: any[]): Project => ({
  id: getID(data),
  name: data.name,
  prompts: prompts.filter(prompt => prompt.projectID === getID(data)).map(toPrompt),
})

const uniqueName = (name: string, existingNames: Set<string>) => {
  let uniqueName = name
  let counter = 2
  while (existingNames.has(uniqueName)) {
    uniqueName = `${name} ${counter++}`
  }
  return uniqueName
}

export async function addProjectForUser(userID: number): Promise<number> {
  const existingProjects = await getProjectsForUser(userID)
  const existingNames = new Set(existingProjects.map(project => project.name))
  const name = uniqueName('New Project', existingNames)
  const key = buildKey(Entity.PROJECT)
  await getDatastore().save({ key, data: { name, userID, createdAt: new Date() } })
  return await addPromptForUser(userID, Number(key.id))
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const [projects] = await getEntities(Entity.PROJECT, 'userID', userID)
  const [prompts] = await getEntities(Entity.PROMPT, 'userID', userID)
  return projects.map(project => toProject(project, prompts))
}

const toPrompt = (data: any): Prompt => ({ id: getID(data), prompt: data.prompt })

export async function addPromptForUser(userID: number, projectID: number): Promise<number> {
  const [existingPrompts] = await getFilteredEntities(
    Entity.PROMPT,
    and([new PropertyFilter('userID', '=', userID), new PropertyFilter('projectID', '=', projectID)])
  )
  const existingNames = new Set(existingPrompts.map(prompt => prompt.prompt))
  const prompt = uniqueName('New Prompt', existingNames)
  const key = buildKey(Entity.PROMPT)
  await getDatastore().save({ key, data: { userID, projectID, prompt, createdAt: new Date() } })
  return Number(key.id)
}

export async function savePromptForUser(userID: number, promptID: number, prompt: string) {
  const datastore = getDatastore()
  const key = buildKey(Entity.PROMPT, promptID)
  const [promptData] = await datastore.get(buildKey(Entity.PROMPT, promptID))
  if (promptData.userID === userID) {
    await datastore.save({ key, data: { ...promptData, prompt } })
    await saveVersion(userID, promptID, prompt)
  }
}

async function saveVersion(userID: number, promptID: number, prompt: string) {
  const key = buildKey(Entity.VERSION)
  await getDatastore().save({ key, data: { userID, promptID, prompt, createdAt: new Date() } })
}

const toVersion = (data: any): Version => ({ id: getID(data), timestamp: getTimestamp(data), prompt: data.prompt })

export async function getVersionsForPrompt(userID: number, promptID: number): Promise<Version[]> {
  const [versions] = await getEntities(Entity.VERSION, 'promptID', promptID)
  return versions.filter(version => version.userID === userID).map(toVersion)
}
