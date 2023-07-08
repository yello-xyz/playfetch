import { getVersion, toggleVersionLabel } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function toggleLabel(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const promptID = await getVersion(versionID).then(version => version.promptID)

  await toggleVersionLabel(user.id, versionID, promptID, req.body.projectID, req.body.label, req.body.checked)
  res.json({})
}

export default withLoggedInUserRoute(toggleLabel)
