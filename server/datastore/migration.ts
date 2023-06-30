import { migrateAccess } from './access'
import { migrateEndpoints } from './endpoints'
import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateRuns } from './runs'
import { migrateVersions } from './versions'

export async function runDataMigration() {
  await migrateProjects()
  // await migratePrompts()
  // await migrateVersions()
  // await migrateRuns()
  // await migrateEndpoints()
  // await migrateAccess()
}
