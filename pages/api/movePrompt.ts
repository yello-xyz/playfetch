import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { updatePromptProject } from '@/server/datastore/prompts'

async function movePrompt(req: NextApiRequest, res: NextApiResponse) {
  await updatePromptProject(req.session.user!.id, req.body.promptID, req.body.projectID)
  res.json({})
}

export default withLoggedInSessionRoute(movePrompt)
