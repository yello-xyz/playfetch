import { exportPromptsFromProject } from '@/src/server/github'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function exportPrompts(req: NextApiRequest, res: NextApiResponse, user: User) {
  await exportPromptsFromProject(user.id, req.body.projectID, req.body.versionID, req.body.fileName)
  res.json({})
}

export default withLoggedInUserRoute(exportPrompts)
