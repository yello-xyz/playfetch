import { getPromptsForProject } from '@/server/datastore/prompts'
import { withLoggedInSessionRoute } from '@/server/session'
import { Prompt } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompts(req: NextApiRequest, res: NextApiResponse<Prompt[]>) {
  const prompts = await getPromptsForProject(req.session.user!.id, req.body.projectID ?? null)
  res.json(prompts)
}

export default withLoggedInSessionRoute(getPrompts)
