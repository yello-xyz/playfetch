import { savePrompt } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function addPrompt(req: NextApiRequest, res: NextApiResponse) {
  await savePrompt(req.body.prompt)
  res.json({})
}

export default withLoggedInSessionRoute(addPrompt)
