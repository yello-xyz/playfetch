import { getTableForUser } from '@/src/server/datastore/tables'
import { withLoggedInUserRoute } from '@/src/server/session'
import { InputValues, Table, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getTable(
  req: NextApiRequest,
  res: NextApiResponse<{ table: Table; inputValues: InputValues }>,
  user: User
) {
  const table = await getTableForUser(user.id, req.body.tableID)
  res.json(table)
}

export default withLoggedInUserRoute(getTable)
