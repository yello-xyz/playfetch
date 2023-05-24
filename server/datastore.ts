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

export const addID = (entity?: any) => (entity ? { ...entity, id: entity[getDatastore().KEY].name } : entity)

function buildQuery(type: string, key: string, value: {}, limit: number = 1) {
  return getDatastore().createQuery(type).filter(new PropertyFilter(key, '=', value)).limit(limit)
}

export async function savePrompt(prompt: string) {
  const datastore = getDatastore()
  const key = datastore.key(Entity.PROMPT)
  await datastore.save({ key, data: { prompt } })
}

export async function getPrompts(): Promise<string[]> {
  const datastore = getDatastore()
  const query = datastore.createQuery(Entity.PROMPT)
  const [prompts] = await datastore.runQuery(query)
  return prompts.map(prompt => prompt.prompt)
}

type User = {
  id: string
  email: string
  isAdmin: boolean
}

export async function saveUser({ email, isAdmin }: User) {
  const datastore = getDatastore()
  const user = await getUser(email)
  const key = datastore.key([Entity.USER, ...(user ? [user.id] : [])])
  await datastore.save({ key, data: { email, isAdmin } })
}

export async function getUser(email: string): Promise<User | undefined> {
  const [[user]] = await getDatastore().runQuery(buildQuery(Entity.USER, 'email', email))
  return addID(user)
}
