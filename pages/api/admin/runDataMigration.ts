import { runDataMigration } from '@/server/datastore/migration'
import { withAdminUserRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addUser(_: NextApiRequest, res: NextApiResponse) {
  await runDataMigration()
  res.json({})
}

export default withAdminUserRoute(addUser)
