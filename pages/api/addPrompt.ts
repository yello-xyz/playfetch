import logUserRequest, { CreateEvent } from '@/src/server/analytics'
import { addPromptForUser } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addPrompt(
  req: NextApiRequest,
  res: NextApiResponse<{ promptID: number; versionID: number }>,
  user: User
) {
  const projectID = req.body.projectID
  logUserRequest(req, res, user.id, CreateEvent('prompt', projectID))
  const { promptID, versionID } = await addPromptForUser(user.id, projectID)
  res.json({ promptID, versionID })
}

export default withLoggedInUserRoute(addPrompt)
