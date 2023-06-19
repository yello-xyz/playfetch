import { Entity, getDatastore } from './datastore'
import { updatePrompt } from './prompts'

export async function runDataMigration() {
  const datastore = getDatastore()
  const [allPrompts] = await datastore.runQuery(datastore.createQuery(Entity.PROMPT))
  for (const promptData of allPrompts) {
    await updatePrompt(promptData)
  }
}

