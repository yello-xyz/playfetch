import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateVersions } from './versions'

export async function runDataMigration() {
  // await migrateProjects()
  // await migratePrompts()
  await migrateVersions()
}

