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
  console.log('Migrating logs')
  await migrateLogs(postMerge)
  console.log('Migrating inputs')
  await migrateInputs(postMerge)
  console.log('Migrating comments')
  await migrateComments(postMerge)
  console.log('Migrating runs')
  await migrateRuns(postMerge)
  console.log('Migrating versions')
  await migrateVersions(postMerge)
  console.log('Migrating chains')
  await migrateChains(postMerge)
  console.log('Done')
}
