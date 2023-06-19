import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'

export async function runDataMigration() {
  await migrateProjects()
  // await migratePrompts()
}

