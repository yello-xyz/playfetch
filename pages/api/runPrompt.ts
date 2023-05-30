import { saveRun } from '@/server/datastore'
import completeChat from '@/server/openai'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function runPrompt(req: NextApiRequest, res: NextApiResponse<string | undefined>) {
  const userID = req.session.user!.id
  const output = await completeChat('', req.body.prompt, userID)
  if (output?.length) {
    await saveRun(userID, req.body.promptID, req.body.versionID, output)
  }
  res.json(output)
}

export default withLoggedInSessionRoute(runPrompt)
