import { saveProviderKey } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function getGithubAppInstallLink(req: NextApiRequest, res: NextApiResponse<string>, user: User) {
  await saveProviderKey(user.id, user.id, 'github', null, req.body.projectID)
  res.json(process.env.GITHUB_APP_INSTALL_LINK ?? '')
}

export default withLoggedInUserRoute(getGithubAppInstallLink)
