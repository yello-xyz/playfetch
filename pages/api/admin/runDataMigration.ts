import { runDataMigration } from '@/server/datastore/datastore'
import { withAdminRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addUser(_: NextApiRequest, res: NextApiResponse) {
  await runDataMigration()
  res.json({})
}

export default withAdminRoute(addUser)
