import { withLoggedInUserRoute } from '@/src/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { updatePromptName } from '@/src/server/datastore/prompts'
import { User } from '@/types'

async function renamePrompt(req: NextApiRequest, res: NextApiResponse, user: User) {
  await updatePromptName(user.id, req.body.promptID, req.body.name)
  res.json({})
}

export default withLoggedInUserRoute(renamePrompt)
