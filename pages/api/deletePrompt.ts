import { deletePromptForUser } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deletePrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  await deletePromptForUser(user.id, req.body.promptID)
  res.json({})
}

export default withLoggedInUserRoute(deletePrompt)
