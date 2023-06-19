import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { updatePromptName } from '@/server/datastore/prompts'

async function renamePrompt(req: NextApiRequest, res: NextApiResponse) {
  await updatePromptName(req.session.user!.id, req.body.promptID, req.body.name)
  res.json({})
}

export default withLoggedInSessionRoute(renamePrompt)
