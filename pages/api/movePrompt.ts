import { withLoggedInUserRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { updatePromptProject } from '@/server/datastore/prompts'
import { User } from '@/types'

async function movePrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updatePromptProject(user.id, req.body.promptID, req.body.projectID)
  res.json({})
}

export default withLoggedInUserRoute(movePrompt)
