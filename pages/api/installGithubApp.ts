import { UserSettingsRoute } from '@/src/common/clientRoute'
import { getProviderCredentials } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'

async function installGithubApp(_: NextApiRequest, res: NextApiResponse<string>, user: User) {
  const { apiKey: installationID } = await getProviderCredentials([user.id], 'github')
  if (installationID) {
    // TODO refresh repositories based on installation ID or remove provider and reinstall if uninstalled.
    res.json(UserSettingsRoute('sourceControl'))
  } else {
    res.json(process.env.GITHUB_APP_INSTALL_LINK ?? '')
  }
}

export default withLoggedInUserRoute(installGithubApp)
