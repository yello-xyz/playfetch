import importPromptsToProject from '@/src/server/providers/github'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function importPrompts(req: NextApiRequest, res: NextApiResponse, user: User) {
  await importPromptsToProject(user.id, req.body.projectID)
  res.json({})
}

export default withLoggedInUserRoute(importPrompts)
