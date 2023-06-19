import { deletePromptForUser } from '@/server/datastore/prompts'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function deleteVersion(req: NextApiRequest, res: NextApiResponse) {
  await deletePromptForUser(req.session.user!.id, req.body.promptID)
  res.json({})
}

export default withLoggedInSessionRoute(deleteVersion)
