import { saveVersionForUser } from '@/server/datastore/versions'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updatePrompt(req: NextApiRequest, res: NextApiResponse<number>) {
  const versionID = await saveVersionForUser(
    req.session.user!.id,
    req.body.promptID,
    req.body.prompt,
    req.body.config,
    req.body.tags,
    req.body.versionID
  )
  res.json(versionID!)
}

export default withLoggedInSessionRoute(updatePrompt)
