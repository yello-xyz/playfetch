import { runDataMigration } from '@/src/server/datastore/migration'
import { withAdminUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addUser(_: NextApiRequest, res: NextApiResponse) {
  await runDataMigration()
  res.json({})
}

export default withAdminUserRoute(addUser)
