import { migrateAccess } from './access'
import { migrateComments } from './comments'
import { migrateEndpoints } from './endpoints'
import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateRuns } from './runs'
import { migrateUsers } from './users'
import { migrateVersions } from './versions'

export async function runDataMigration() {
  // await migrateProjects()
  // await migratePrompts()
  await migrateVersions()
  // await migrateRuns()
  // await migrateEndpoints()
  // await migrateAccess()
  // await migrateUsers()
  // await migrateComments()
}
