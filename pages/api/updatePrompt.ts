import { savePromptVersionForUser } from '@/src/server/datastore/versions'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updatePrompt(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const versionID = await savePromptVersionForUser(
    user.id,
    req.body.promptID,
    req.body.prompt,
    req.body.config,
    req.body.versionID
  )
  res.json(versionID!)
}

export default withLoggedInUserRoute(updatePrompt)
