import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@/types'
import { updateTableName } from '@/src/server/datastore/tables'

async function renameTable(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateTableName(user.id, req.body.tableID, req.body.name)
  res.json({})
}

export default withLoggedInUserRoute(renameTable)
