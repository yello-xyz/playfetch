'use server'

import { Datastore } from '@google-cloud/datastore'

let datastore: Datastore
const getDatastore = () => {
  if (!datastore) {
    datastore = new Datastore()
  }
  return datastore
}

enum Entity {
  PROMPT = 'prompt',
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
