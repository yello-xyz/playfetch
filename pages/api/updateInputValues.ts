import { saveInputValues } from '@/src/server/datastore/inputs'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateInputValues(req: NextApiRequest, res: NextApiResponse, user: User) {
  await saveInputValues(user.id, req.body.projectID, req.body.name, req.body.values)
  res.json({})
}

export default withLoggedInUserRoute(updateInputValues)
