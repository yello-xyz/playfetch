import { saveVersionLabels } from '@/server/datastore/versions'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateVersionLabels(req: NextApiRequest, res: NextApiResponse) {
  await saveVersionLabels(req.body.userID, req.body.versionID, req.body.projectID, req.body.labels)
  res.json({})
}

export default withLoggedInSessionRoute(updateVersionLabels)
