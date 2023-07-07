import { saveComment } from '@/src/server/datastore/comments'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addComment(req: NextApiRequest, res: NextApiResponse, user: User) {
  await saveComment(
    user.id,
    req.body.promptID,
    req.body.versionID,
    req.body.text,
    undefined,
    req.body.quote,
    req.body.runID,
    req.body.startIndex,
  )
  res.json({})
}

export default withLoggedInUserRoute(addComment)
