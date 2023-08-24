import { saveComment } from '@/src/server/datastore/comments'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addComment(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const parentID = await getTrustedVersion(versionID).then(version => version.parentID)

  await saveComment(
    user.id,
    parentID,
    versionID,
    req.body.text,
    undefined,
    req.body.runID,
    req.body.quote,
    req.body.startIndex
  )

  res.json({})
}

export default withLoggedInUserRoute(addComment)
