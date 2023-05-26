import { getVersionsForPrompt } from '@/server/datastore'
import { withLoggedInSessionRoute } from '@/server/session'
import { Version } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getPromptVersions(req: NextApiRequest, res: NextApiResponse<Version[]>) {
  const versions = await getVersionsForPrompt(req.session.user!.id, req.body.promptID)
  res.json(versions)
}

export default withLoggedInSessionRoute(getPromptVersions)
