import { updateVersionLabel } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function toggleVersionLabel(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updateVersionLabel(
    user.id,
    req.body.versionID,
    req.body.projectID,
    req.body.label,
    req.body.checked,
    req.body.replyTo
  )
  res.json({})
}

export default withLoggedInUserRoute(toggleVersionLabel)
