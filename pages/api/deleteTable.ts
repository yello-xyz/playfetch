import { deleteTableForUser } from '@/src/server/datastore/tables'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteTable(req: NextApiRequest, res: NextApiResponse, user: User) {
  await deleteTableForUser(user.id, req.body.tableID)
  res.json({})
}

export default withLoggedInUserRoute(deleteTable)
