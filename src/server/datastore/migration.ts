import { migrateAccess } from './access'
import { migrateAnalytics } from './analytics'
import { migrateBudgets } from './budget'
import { migrateCache } from './cache'
import { migrateChains } from './chains'
import { migrateComments } from './comments'
import { migrateCosts } from './cost'
import { migrateEndpoints } from './endpoints'
import { migrateInputs } from './inputs'
import { migrateLogs } from './logs'
import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateProviders } from './providers'
import { migrateRuns } from './runs'
import { migrateUsage } from './usage'
import { migrateUsers } from './users'
import { migrateVersions } from './versions'
import { migrateWorkspaces } from './workspaces'

export async function runDataMigrations(postMerge: boolean) {
  await migrateProviders(postMerge)
}
