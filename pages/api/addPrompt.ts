import { addPromptForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addPrompt(req: NextApiRequest, res: NextApiResponse<number>) {
  const promptID = await addPromptForUser(req.session.user!.id, req.body.name, req.body.projectID)
  res.json(promptID)
}

export default withLoggedInSessionRoute(addPrompt)
