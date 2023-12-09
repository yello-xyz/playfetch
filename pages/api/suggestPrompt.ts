import { suggestImprovementForPrompt } from '@/src/server/providers/playfetch'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function suggestPrompt(req: NextApiRequest, res: NextApiResponse<{}>, user: User) {
  await suggestImprovementForPrompt(user.id, req.body.promptID, req.body.versionID, req.body.currentVersionID)
  res.json({})
}

export default withLoggedInUserRoute(suggestPrompt)
