import { migrateAccess } from './access'
import { migrateChains } from './chains'
import { migrateComments } from './comments'
import { migrateEndpoints } from './endpoints'
import { migrateInputs } from './inputs'
import { migrateLogs } from './logs'
import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateRuns } from './runs'
import { migrateUsage } from './usage'
import { migrateUsers } from './users'
import { migrateVersions } from './versions'
import { migrateWorkspaces } from './workspaces'

export async function runDataMigrations(postMerge: boolean) {
  // await migrateLogs(postMerge)
  // await migrateInputs(postMerge)
  // await migrateComments(postMerge)
  // await migrateRuns(postMerge)
  // await migrateVersions(postMerge)
  await migrateChains(postMerge)
}
