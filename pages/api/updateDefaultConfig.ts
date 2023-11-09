import { saveDefaultPromptConfigForUser } from '@/src/server/datastore/users'
import { withLoggedInUserRoute } from '@/src/server/session'
import { PromptConfig, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateDefaultConfig(req: NextApiRequest, res: NextApiResponse<PromptConfig>, user: User) {
  const defaultPromptConfig = await saveDefaultPromptConfigForUser(user.id, req.body.defaultPromptConfig)
  res.json(defaultPromptConfig)
}

export default withLoggedInUserRoute(updateDefaultConfig)
