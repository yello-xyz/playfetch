import logUserRequest, { CreateEvent } from '@/src/server/analytics'
import { saveComment } from '@/src/server/datastore/comments'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { Comment, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addComment(req: NextApiRequest, res: NextApiResponse<Comment>, user: User) {
  const versionID = req.body.versionID
  const parentID = await getTrustedVersion(versionID).then(version => version.parentID)
  logUserRequest(req, res, user.id, CreateEvent('comment', parentID))

  const comment = await saveComment(
    user.id,
    parentID,
    versionID,
    req.body.text,
    req.body.replyTo,
    undefined,
    req.body.runID,
    req.body.quote,
    req.body.itemIndex,
    req.body.startIndex
  )

  res.json(comment)
}

export default withLoggedInUserRoute(addComment)
