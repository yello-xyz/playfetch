import { getPromptForUser } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import { Prompt } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompt(req: NextApiRequest, res: NextApiResponse<Prompt>) {
  const prompt = await getPromptForUser(req.session.user!.id, req.body.promptID)
  res.json(prompt)
}

export default withLoggedInSessionRoute(getPrompt)
