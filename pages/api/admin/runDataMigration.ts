import { runDataMigrations } from '@/src/server/datastore/migration'
import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function runDataMigration(req: NextApiRequest, res: NextApiResponse) {
  const confirm = req.query.confirm === 'true'
  const postMerge = req.query.postMerge === 'true'

  if (confirm) {
    await runDataMigrations(postMerge)
  }

  res.json({})
}

export default withAdminUserRoute(runDataMigration)
