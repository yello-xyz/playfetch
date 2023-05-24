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

async function getUserInternal(email: string) {
  const [[user]] = await getDatastore().runQuery(buildQuery(Entity.USER, 'email', email))
  return user
}

type User = {
  email: string
  isAdmin: boolean
}

export async function saveUser({ email, isAdmin }: User) {
  const datastore = getDatastore()
  const user = await getUserInternal(email)
  const key = user ? user[datastore.KEY] : datastore.key(Entity.USER)
  await datastore.save({ key, data: { email, isAdmin } })
}

export async function getUser(email: string): Promise<User | undefined> {
  const user = await getUserInternal(email)
  return user as User | undefined
}
