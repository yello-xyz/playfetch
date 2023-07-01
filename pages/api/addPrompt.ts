import { addPromptForUser } from '@/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addPrompt(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const promptID = await addPromptForUser(user.id, req.body.projectID)
  res.json(promptID)
}

export default withLoggedInUserRoute(addPrompt)
