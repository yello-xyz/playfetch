import { Datastore, PropertyFilter } from '@google-cloud/datastore'

let datastore: Datastore
const getDatastore = () => {
  if (!datastore) {
    datastore = new Datastore()
  }
  return datastore
}

enum Entity {
  USER = 'user',
  PROMPT = 'prompt',
}

export const addID = (entity?: any) => (entity ? { ...entity, id: Number(entity[getDatastore().KEY].id) } : entity)

const buildKey = (type: string, id?: string | number) => getDatastore().key([type, ...(id ? [id] : [])])

const buildQuery = (type: string, key: string, value: {}, limit: number = 1) =>
  getDatastore().createQuery(type).filter(new PropertyFilter(key, '=', value)).limit(limit)

export async function savePrompt(prompt: string) {
  const datastore = getDatastore()
  const key = buildKey(Entity.PROMPT)
  await datastore.save({ key, data: { prompt } })
}

export async function getPrompts(): Promise<string[]> {
  const datastore = getDatastore()
  const query = datastore.createQuery(Entity.PROMPT)
  const [prompts] = await datastore.runQuery(query)
  return prompts.map(prompt => prompt.prompt)
}

type User = {
  id: number
  email: string
  isAdmin: boolean
}

const toUser = (user?: any): User | undefined => user ? addID({ email: user.email, isAdmin: user.isAdmin }) : user

export async function getUser(userID: number): Promise<User | undefined> {
  const datastore = getDatastore()
  const [userData] = await datastore.get(buildKey(Entity.USER, userID))
  return toUser(userData)
}

export async function getUserForEmail(email: string): Promise<User | undefined> {
  const [[userData]] = await getDatastore().runQuery(buildQuery(Entity.USER, 'email', email))
  return toUser(userData)
}

export async function saveUser(email: string, isAdmin: boolean) {
  const datastore = getDatastore()
  const user = await getUserForEmail(email)
  const key = buildKey(Entity.USER, user?.id)
  await datastore.save({ key, data: { email, isAdmin } })
}
