import { saveInputValues } from '@/server/datastore/inputs'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateInputValues(req: NextApiRequest, res: NextApiResponse) {
  await saveInputValues(req.session.user!.id, req.body.projectID, req.body.name, req.body.values)
  res.json({})
}

export default withLoggedInSessionRoute(updateInputValues)
