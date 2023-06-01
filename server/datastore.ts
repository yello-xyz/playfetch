import { Project, Prompt, Run, User, Version } from '@/types'
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
  RUN = 'run',
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

const uniqueName = (name: string, existingNames: Set<string>) => {
  let uniqueName = name
  let counter = 2
  while (existingNames.has(uniqueName)) {
    uniqueName = `${name} ${counter++}`
  }
  return uniqueName
}

const toProjectData = (userID: number, name: string, createdAt: Date) => ({
  key: buildKey(Entity.PROJECT),
  data: { userID, name, createdAt },
  excludeFromIndexes: ['name'],
})

const toProject = (data: any, prompts: any[]): Project => ({
  id: getID(data),
  name: data.name,
  timestamp: getTimestamp(data),
  prompts: prompts.filter(prompt => prompt.projectID === getID(data)).map(toPrompt),
})

export async function addProjectForUser(userID: number): Promise<number> {
  const existingProjects = await getProjectsForUser(userID)
  const existingNames = new Set(existingProjects.map(project => project.name))
  const name = uniqueName('New Project', existingNames)
  const projectData = toProjectData(userID, name, new Date())
  await getDatastore().save(projectData)
  return await addPromptForUser(userID, Number(projectData.key.id))
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const [projects] = await getEntities(Entity.PROJECT, 'userID', userID)
  const [prompts] = await getEntities(Entity.PROMPT, 'userID', userID)
  return projects.map(project => toProject(project, prompts))
}

const toPromptData = (userID: number, projectID: number, name: string, createdAt: Date, promptID?: number) => ({
  key: buildKey(Entity.PROMPT, promptID),
  data: { userID, projectID, name, createdAt },
  excludeFromIndexes: ['name'],
})

const toPrompt = (data: any): Prompt => ({ id: getID(data), name: data.name })

export async function addPromptForUser(userID: number, projectID: number): Promise<number> {
  const [existingPrompts] = await getFilteredEntities(
    Entity.PROMPT,
    and([new PropertyFilter('userID', '=', userID), new PropertyFilter('projectID', '=', projectID)])
  )
  const existingNames = new Set(existingPrompts.map(prompt => prompt.name))
  const name = uniqueName('New Prompt', existingNames)
  const promptData = toPromptData(userID, projectID, name, new Date())
  await getDatastore().save(prompt)
  await savePromptForUser(userID, Number(promptData.key.id), name, '', '')
  return Number(promptData.key.id)
}

export async function savePromptForUser(
  userID: number,
  promptID: number,
  prompt: string,
  title: string,
  tags: string,
  previousVersionID?: number,
  versionID?: number
) {
  const datastore = getDatastore()
  const promptKey = buildKey(Entity.PROMPT, promptID)
  const [promptData] = await datastore.get(promptKey)
  if (promptData?.userID === userID) {
    const name = title.length ? title : prompt
    await datastore.save(toPromptData(userID, promptData.projectID, name, promptData.createdAt, promptID))
    const versionData = toVersionData(userID, promptID, prompt, title, tags, new Date(), previousVersionID, versionID)
    await getDatastore().save(versionData)
    return Number(versionData.key.id)
  }
  return undefined
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

export async function getVersionsForPrompt(userID: number, promptID: number): Promise<Version[]> {
  const [versions] = await getEntities(Entity.VERSION, 'promptID', promptID)
  const [runs] = await getEntities(Entity.RUN, 'promptID', promptID)
  return versions.filter(version => version.userID === userID).map(version => toVersion(version, runs))
}

export async function saveRun(userID: number, promptID: number, versionID: number, output: string) {
  const key = buildKey(Entity.RUN)
  await getDatastore().save({ key, data: { userID, promptID, versionID, output, createdAt: new Date() } })
}

const toRun = (data: any): Run => ({ id: getID(data), timestamp: getTimestamp(data), output: data.output })
