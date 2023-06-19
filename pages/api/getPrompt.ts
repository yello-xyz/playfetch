import { getPromptWithVersions } from '@/server/datastore/prompts'
import { withLoggedInSessionRoute } from '@/server/session'
import { ActivePrompt } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompt(req: NextApiRequest, res: NextApiResponse<ActivePrompt>) {
  const prompt = await getPromptWithVersions(req.session.user!.id, req.body.promptID)
  res.json(prompt)
}

export default withLoggedInSessionRoute(getPrompt)
