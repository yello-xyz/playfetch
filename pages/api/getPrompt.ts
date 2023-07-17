import { getActivePrompt } from '@/src/server/datastore/prompts'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import { withLoggedInUserRoute } from '@/src/server/session'
import { ActivePrompt, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompt(req: NextApiRequest, res: NextApiResponse<ActivePrompt>, user: User) {
  const prompt = await getActivePrompt(user.id, req.body.promptID, urlBuilderFromHeaders(req.headers))
  res.json(prompt)
}

export default withLoggedInUserRoute(getPrompt)
