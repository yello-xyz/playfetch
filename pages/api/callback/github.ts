import { UserSettingsRoute } from '@/src/common/clientRoute'
import { saveProviderKey } from '@/src/server/datastore/providers'
import { withLoggedInUserRoute } from '@/src/server/session'
import { User } from '@/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Octokit } from 'octokit'

async function github(req: NextApiRequest, res: NextApiResponse, user: User) {
  const { code, installation_id } = req.query

  const query = new URLSearchParams()
  query.set('client_id', process.env.GITHUB_APP_CLIENT_ID ?? '')
  query.set('client_secret', process.env.GITHUB_APP_CLIENT_SECRET ?? '')
  query.set('code', code as string)

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: query.toString(),
  }).then(response => response.json())

  const installationID = Number(installation_id)

  const octokit = new Octokit({ auth: response.access_token })
  const userInstallations = await octokit.request('GET /user/installations')

  if (userInstallations.data.installations.some(installation => installation.id === installationID)) {
    const installationRepos = await octokit.request('GET /user/installations/{installation_id}/repositories', {
      installation_id: installationID,
    })
    const repositories = installationRepos.data.repositories.map(repository => repository.full_name)
    await saveProviderKey(user.id, user.id, 'github', installationID.toString(), JSON.stringify(repositories))
  }

  res.redirect(UserSettingsRoute('sourceControl'))
}

export default withLoggedInUserRoute(github)
