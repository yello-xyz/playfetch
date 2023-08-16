import { getPromptVersionsForUser } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { Version, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPromptEntities(req: NextApiRequest, res: NextApiResponse<Version[]>, user: User) {
  const versions = await getPromptVersionsForUser(user.id, req.body.promptID)
  res.json(versions)
}

export default withLoggedInUserRoute(getPromptEntities)
