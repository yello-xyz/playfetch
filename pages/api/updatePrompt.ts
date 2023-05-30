import { savePromptForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updatePrompt(req: NextApiRequest, res: NextApiResponse) {
  await savePromptForUser(req.session.user!.id, req.body.promptID, req.body.prompt, req.body.tags, req.body.versionID)
  res.json({})
}

export default withLoggedInSessionRoute(updatePrompt)
