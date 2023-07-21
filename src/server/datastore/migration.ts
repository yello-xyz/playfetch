import { migrateAccess } from './access'
import { migrateChains } from './chains'
import { migrateComments } from './comments'
import { migrateEndpoints } from './endpoints'
import { migrateInputs } from './inputs'
import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateRuns } from './runs'
import { migrateUsage } from './usage'
import { migrateUsers } from './users'
import { migrateVersions } from './versions'
import { migrateWorkspaces } from './workspaces'

export async function runDataMigrations() {
  // await migrateWorkspaces()
  // await migrateProjects()
  // await migrateInputs()
  // await migrateAccess()
  await migratePrompts()
  // await migrateVersions()
  // await migrateRuns()
  await migrateChains()
  // await migrateEndpoints()
  // await migrateUsage()
  // await migrateUsers()
  // await migrateComments()
}
