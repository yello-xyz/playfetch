import { getActivePrompt } from '@/src/server/datastore/prompts'
import { getVersion } from '@/src/server/datastore/versions'
import { urlBuilderFromHeaders } from '@/src/server/routing'
import { withLoggedInUserRoute } from '@/src/server/session'
import { ActivePrompt, User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPrompt(req: NextApiRequest, res: NextApiResponse<ActivePrompt>, user: User) {
  const promptID = req.body.promptID ?? (await getVersion(req.body.versionID).then(version => version.promptID))
  const prompt = await getActivePrompt(user.id, promptID, urlBuilderFromHeaders(req.headers))
  res.json(prompt)
}

export default withLoggedInUserRoute(getPrompt)
