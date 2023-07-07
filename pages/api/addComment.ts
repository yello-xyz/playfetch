import { saveComment } from '@/src/server/datastore/comments'
import { getVersion } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addComment(req: NextApiRequest, res: NextApiResponse, user: User) {
  const versionID = req.body.versionID
  const promptID = await getVersion(versionID).then(version => version.promptID)
  
  await saveComment(
    user.id,
    promptID,
    versionID,
    req.body.text,
    undefined,
    req.body.quote,
    req.body.runID,
    req.body.startIndex
  )

  res.json({})
}

export default withLoggedInUserRoute(addComment)
