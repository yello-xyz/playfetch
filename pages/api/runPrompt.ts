import { savePromptForUser, saveRun } from '@/server/datastore'
import completeChat from '@/server/openai'
import { withLoggedInSessionRoute } from '@/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'

async function runPrompt(req: NextApiRequest, res: NextApiResponse<string | undefined>) {
  const userID = req.session.user!.id
  const promptID = req.body.promptID
  const prompt = req.body.prompt
  const versionID = req.body.versionID ?? await savePromptForUser(userID, promptID, prompt)

  const output = await completeChat('', prompt, userID)
  if (output?.length) {
    await saveRun(userID, promptID, versionID, output)
  }
  res.json(output)
}

export default withLoggedInSessionRoute(runPrompt)
