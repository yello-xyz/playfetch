import { getPromptWithVersions } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import { PromptWithVersions } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompt(req: NextApiRequest, res: NextApiResponse<PromptWithVersions>) {
  const prompt = await getPromptWithVersions(req.session.user!.id, req.body.promptID)
  res.json(prompt)
}

export default withLoggedInSessionRoute(getPrompt)
