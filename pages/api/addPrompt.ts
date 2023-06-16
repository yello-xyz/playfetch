import { addPromptForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import { Prompt } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addPrompt(req: NextApiRequest, res: NextApiResponse<Prompt>) {
  const prompt = await addPromptForUser(req.session.user!.id, req.body.projectID)
  res.json(prompt)
}

export default withLoggedInSessionRoute(addPrompt)
