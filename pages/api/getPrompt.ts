import { getPromptForUser } from '@/src/server/datastore/prompts'
import { withLoggedInUserRoute } from '@/src/server/session'
import { Version, User, InputValues, Prompt } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompt(
  req: NextApiRequest,
  res: NextApiResponse<{ prompt: Prompt; versions: Version[]; inputValues: InputValues }>,
  user: User
) {
  const prompt = await getPromptForUser(user.id, req.body.promptID)
  res.json(prompt)
}

export default withLoggedInUserRoute(getPrompt)
