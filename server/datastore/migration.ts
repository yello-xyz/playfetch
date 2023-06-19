import { migratePrompts } from './prompts'

export async function runDataMigration() {
  await migratePrompts()
}

