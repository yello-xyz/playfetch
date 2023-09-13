import logUserEvent, { CreateEvent } from '@/src/server/analytics'
import { savePromptVersionForUser } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updatePrompt(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const promptID = req.body.promptID
  logUserEvent(req, res, user.id, CreateEvent('version', promptID))
  const versionID = await savePromptVersionForUser(
    user.id,
    promptID,
    req.body.prompts,
    req.body.config,
    req.body.versionID
  )
  res.json(versionID)
}

export default withLoggedInUserRoute(updatePrompt)
