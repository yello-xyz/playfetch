import { migrateAccess } from './access'
import { migrateChains } from './chains'
import { migrateComments } from './comments'
import { migrateEndpoints } from './endpoints'
import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateRuns } from './runs'
import { migrateUsage } from './usage'
import { migrateUsers } from './users'
import { migrateVersions } from './versions'

export async function runDataMigrations() {
  // await migrateProjects()
  // await migratePrompts()
  // await migrateVersions()
  // await migrateRuns()
  // await migrateChains()
  await migrateEndpoints()
  // await migrateUsage()
  // await migrateAccess()
  // await migrateUsers()
  // await migrateComments()
}
