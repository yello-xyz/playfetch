import { deletePromptForUser } from '@/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deletePrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  await deletePromptForUser(user.id, req.body.promptID)
  res.json({})
}

export default withLoggedInUserRoute(deletePrompt)
