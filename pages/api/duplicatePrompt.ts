import { duplicatePromptForUser } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function duplicatePrompt(req: NextApiRequest, res: NextApiResponse<number>, user: User) {
  const newPromptID = await duplicatePromptForUser(user.id, req.body.promptID)
  res.json(newPromptID)
}

export default withLoggedInUserRoute(duplicatePrompt)
