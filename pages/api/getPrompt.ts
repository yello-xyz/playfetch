import { getActivePrompt } from '@/server/datastore/prompts'
import { urlBuilderFromHeaders } from '@/server/routing'
import { withLoggedInSessionRoute } from '@/server/session'
import { ActivePrompt } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompt(req: NextApiRequest, res: NextApiResponse<ActivePrompt>) {
  const prompt = await getActivePrompt(req.session.user!.id, req.body.promptID, urlBuilderFromHeaders(req.headers))
  res.json(prompt)
}

export default withLoggedInSessionRoute(getPrompt)
