import { migrateAccess } from './access'
import { migrateAnalytics } from './analytics'
import { migrateBudgets } from './budgets'
import { migrateCache } from './cache'
import { migrateChains } from './chains'
import { migrateComments } from './comments'
import { migrateCosts } from './costs'
import { migrateEndpoints } from './endpoints'
import { migrateInputs } from './inputs'
import { migrateLogs } from './logs'
import { migrateProjects } from './projects'
import { migratePrompts } from './prompts'
import { migrateProviders } from './providers'
import { migrateRatings } from './ratings'
import { migrateRuns } from './runs'
import { migrateUsage } from './usage'
import { migrateUsers } from './users'
import { migrateVersions } from './versions'
import { migrateWorkspaces } from './workspaces'

export async function runDataMigrations(postMerge: boolean) {
  await migratePrompts(postMerge)
  await migrateChains(postMerge)
  await migrateLogs(postMerge)
  await migrateRatings(postMerge)
  await migrateVersions(postMerge)
  await migrateRuns(postMerge)
  await migrateComments(postMerge)
  await migrateInputs(postMerge)
  await migrateCache(postMerge)
  await migrateAnalytics(postMerge)
  await migrateAccess(postMerge)
  await migrateBudgets(postMerge)
}
