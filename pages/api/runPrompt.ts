import { saveRun } from '@/server/datastore'
import predict from '@/server/openai'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function runPrompt(req: NextApiRequest, res: NextApiResponse) {
  const output = await predict(req.body.prompt, 1.0, 256)
  if (output?.length) {
    await saveRun(req.session.user!.id, req.body.promptID, req.body.versionID, output)
  }
  res.json({})
}

export default withLoggedInSessionRoute(runPrompt)
