import { saveVersionLabels } from '@/server/datastore/versions'
import { withLoggedInUserRoute } from '@/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateVersionLabels(req: NextApiRequest, res: NextApiResponse, user: User) {
  await saveVersionLabels(user.id, req.body.versionID, req.body.projectID, req.body.labels)
  res.json({})
}

export default withLoggedInUserRoute(updateVersionLabels)
