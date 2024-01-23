import logUserRequest, { CreateEvent } from '@/src/server/analytics'
import { addTableForUser } from '@/src/server/datastore/tables'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addTable(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const projectID = req.body.projectID
  logUserRequest(req, res, user.id, CreateEvent('table', projectID))
  const tableID = await addTableForUser(user.id, projectID)
  res.json(tableID)
}

export default withLoggedInUserRoute(addTable)
