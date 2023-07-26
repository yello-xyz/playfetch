import { runDataMigrations } from '@/src/server/datastore/migration'
import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function runDataMigration(_: NextApiRequest, res: NextApiResponse) {
  await runDataMigrations()
  res.json({})
}

export default withAdminUserRoute(runDataMigration)
