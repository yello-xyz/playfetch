import { suggestImprovementForPrompt } from '@/src/server/prediction'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function suggestPrompt(req: NextApiRequest, res: NextApiResponse<{}>, user: User) {
  await suggestImprovementForPrompt(user.id, req.body.promptID, req.body.versionID)
  res.json({})
}

export default withLoggedInUserRoute(suggestPrompt)
