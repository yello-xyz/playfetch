import { saveDefaultPromptConfigForUser } from '@/src/server/datastore/users'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function updateDefaultConfig(req: NextApiRequest, res: NextApiResponse, user: User) {
  await saveDefaultPromptConfigForUser(user.id, req.body.defaultPromptConfig)
  res.json({})
}

export default withLoggedInUserRoute(updateDefaultConfig)
