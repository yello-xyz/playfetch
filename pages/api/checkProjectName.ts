import { CheckValidURLPath, ProjectNameToURLPath } from '@/common/formatting'
import { withLoggedInSessionRoute } from '@/server/session'
import { NextApiRequest, NextApiResponse } from 'next'
import { buildURLForClientRoute } from '@/server/routing'
import { checkProject } from '@/server/datastore/projects'

async function checkProjectName(req: NextApiRequest, res: NextApiResponse<{ url?: string }>) {
  const name = req.body.name
  const urlPath = ProjectNameToURLPath(name)
  const available = CheckValidURLPath(urlPath) && !(await checkProject(urlPath))
  const url = available ? buildURLForClientRoute(`/${urlPath}`, req.headers) : undefined
  res.json({ url })
}

export default withLoggedInSessionRoute(checkProjectName)
