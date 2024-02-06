import logUserRequest, { CreateEvent } from '@/src/server/analytics'
import { getVerifiedUserChain } from '@/src/server/datastore/chains'
import { saveComment } from '@/src/server/datastore/comments'
import { getVerifiedUserPrompt } from '@/src/server/datastore/prompts'
import { getTrustedVersion } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { Comment, IsRawPromptVersion, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addComment(req: NextApiRequest, res: NextApiResponse<Comment>, user: User) {
  const versionID = req.body.versionID
  const version = await getTrustedVersion(versionID, true)
  const parentID = version.parentID
  const parent = IsRawPromptVersion(version)
    ? await getVerifiedUserPrompt(user.id, parentID)
    : await getVerifiedUserChain(user.id, parentID)
  const projectID = parent.projectID
  logUserRequest(req, res, user.id, CreateEvent('comment', parentID))

  const comment = await saveComment(
    user.id,
    projectID,
    parentID,
    versionID,
    req.body.text,
    null,
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
