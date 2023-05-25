import { Project, Prompt, User } from '@/types'
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
}

const getID = (entity: any) => Number(entity[getDatastore().KEY].id)

const buildKey = (type: string, id?: number) => getDatastore().key([type, ...(id ? [id] : [])])

const buildEntityQuery = (type: string, key: string, value: {}) =>
  getDatastore().createQuery(type).filter(new PropertyFilter(key, '=', value)).limit(1)

const buildMultiQuery = (type: string, filter: EntityFilter, limit: number = 100) =>
  getDatastore().createQuery(type).filter(filter).order('createdAt', { descending: true }).limit(limit)

const buildQuery = (type: string, key: string, value: {}, limit?: number) =>
  buildMultiQuery(type, new PropertyFilter(key, '=', value), limit)

const toUser = (data?: any): User | undefined =>
  data ? { id: getID(data), email: data.email, isAdmin: data.isAdmin } : data

export async function getUser(userID: number): Promise<User | undefined> {
  const [userData] = await getDatastore().get(buildKey(Entity.USER, userID))
  return toUser(userData)
}

export async function getUserForEmail(email: string): Promise<User | undefined> {
  const [[userData]] = await getDatastore().runQuery(buildEntityQuery(Entity.USER, 'email', email))
  return toUser(userData)
}

export async function saveUser(email: string, isAdmin: boolean) {
  const user = await getUserForEmail(email)
  const key = buildKey(Entity.USER, user?.id)
  await getDatastore().save({ key, data: { email, isAdmin, createdAt: new Date() } })
}

const toProject = (data: any | undefined, prompts: any[]): Project | undefined =>
  data
    ? {
        id: getID(data),
        name: data.name,
        prompts: prompts.filter(prompt => prompt.projectID === getID(data)).map(toPrompt),
      }
    : data

const uniqueName = (name: string, existingNames: Set<string>) => {
  let uniqueName = name
  let counter = 2
  while (existingNames.has(uniqueName)) {
    uniqueName = `${name} ${counter++}`
  }
  return uniqueName
}

export async function addProjectForUser(userID: number) {
  const existingProjects = await getProjectsForUser(userID)
  const existingNames = new Set(existingProjects.map(project => project.name))
  const name = uniqueName('New Project', existingNames)
  const key = buildKey(Entity.PROJECT)
  await getDatastore().save({ key, data: { name, userID, createdAt: new Date() } })
  await addPromptForUser(userID, Number(key.id))
}

export async function getProjectsForUser(userID: number): Promise<Project[]> {
  const datastore = getDatastore()
  const [projects] = await datastore.runQuery(buildQuery(Entity.PROJECT, 'userID', userID))
  const [prompts] = await datastore.runQuery(buildQuery(Entity.PROMPT, 'userID', userID))
  return projects.map(project => toProject(project, prompts)) as Project[]
}

const toPrompt = (data?: any): Prompt | undefined => (data ? { id: getID(data), prompt: data.prompt } : data)

export async function addPromptForUser(userID: number, projectID: number) {
  const datastore = getDatastore()
  const [existingPrompts] = await datastore.runQuery(
    buildMultiQuery(
      Entity.PROMPT,
      and([new PropertyFilter('userID', '=', userID), new PropertyFilter('projectID', '=', projectID)])
    )
  )
  const existingNames = new Set(existingPrompts.map(prompt => prompt.prompt))
  const prompt = uniqueName('New Prompt', existingNames)
  const key = buildKey(Entity.PROMPT)
  await datastore.save({ key, data: { userID, projectID, prompt, createdAt: new Date() } })
}

export async function savePromptForUser(userID: number, promptID: number, prompt: string) {
  const datastore = getDatastore()
  const key = buildKey(Entity.PROMPT, promptID)
  const [promptData] = await datastore.get(buildKey(Entity.PROMPT, promptID))
  if (promptData.userID === userID) {
    await datastore.save({ key, data: { ...promptData, prompt } })
  }
}
